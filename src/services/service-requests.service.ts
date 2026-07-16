import { ServiceRequest, RequestStatus, NotificationType, SubscriptionPlan, AdvisoryNote } from '@prisma/client';
import { ServiceRequestsRepository } from '../repositories/implementations/service-requests.repository';
import { SubscriptionsRepository } from '../repositories/implementations/subscriptions.repository';
import { NotificationsRepository } from '../repositories/implementations/notifications.repository';
import { AssignmentsRepository } from '../repositories/implementations/assignments.repository';
import { NotesRepository } from '../repositories/implementations/notes.repository';
import { MeetingsRepository } from '../repositories/implementations/meetings.repository';
import { ValidationError, NotFoundError } from '../helpers';
import { PaginatedResult, QueryParams } from '../types';
import { parsePaginationParams, paginateResult, getPrismaPagination } from '../utils/pagination';
import { buildServiceRequestsFilter } from '../helpers/query-builder.helper';
import { isTierSufficient, getMinTierForService } from '../constants/service-types';
import { MESSAGES } from '../constants';
import prisma from '../utils/prisma';

export class ServiceRequestsService {
  private readonly repository: ServiceRequestsRepository;
  private readonly subscriptionsRepository: SubscriptionsRepository;
  private readonly notificationsRepository: NotificationsRepository;
  private readonly assignmentsRepository: AssignmentsRepository;
  private readonly notesRepository: NotesRepository;
  private readonly meetingsRepository: MeetingsRepository;

  constructor() {
    this.repository = new ServiceRequestsRepository();
    this.subscriptionsRepository = new SubscriptionsRepository();
    this.notificationsRepository = new NotificationsRepository();
    this.assignmentsRepository = new AssignmentsRepository();
    this.notesRepository = new NotesRepository();
    this.meetingsRepository = new MeetingsRepository();
  }

  async findAll(query: QueryParams): Promise<PaginatedResult<ServiceRequest>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);
    const where = buildServiceRequestsFilter(query);
    const [requests, total] = await this.repository.findAll({ skip, take, orderBy, where });
    return paginateResult(requests, total, pagination);
  }

  async findById(id: string): Promise<ServiceRequest> {
    const request = await this.repository.findById(id);
    if (!request) throw new NotFoundError(MESSAGES.SERVICE_REQUESTS.NOT_FOUND);
    return request;
  }

  async findByClient(clientId: string, query: QueryParams): Promise<PaginatedResult<ServiceRequest>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);
    const [requests, total] = await this.repository.findByClient(clientId, { skip, take, orderBy });
    return paginateResult(requests, total, pagination);
  }

  async findByAdvisor(userID: string, query: QueryParams): Promise<PaginatedResult<ServiceRequest>> {
    const pagination = parsePaginationParams(query);
    const { skip, take, orderBy } = getPrismaPagination(pagination);
    const [requests, total] = await this.repository.findByAdvisor(userID, { skip, take, orderBy });
    return paginateResult(requests, total, pagination);
  }

  async create(data: Partial<ServiceRequest>, clientId: string): Promise<ServiceRequest> {
    // ── Tier gating: check subscription plan vs service type ──
    const subscription = await this.subscriptionsRepository.findOne({ userId: clientId });
    if (!subscription) {
      throw new ValidationError('No active subscription found. Please subscribe to a plan first.');
    }

    const serviceType = data.serviceType as string;
    if (!isTierSufficient(subscription.plan as SubscriptionPlan, serviceType)) {
      const minTier = getMinTierForService(serviceType);
      throw new ValidationError(
        `This service requires the ${minTier} plan or higher. Your current plan is ${subscription.plan}.`
      );
    }

    // ── Check subscription status (PAST_DUE/EXPIRED should block) ──
    if (subscription.status === 'PAST_DUE' || subscription.status === 'EXPIRED' || subscription.status === 'CANCELED') {
      throw new ValidationError(
        `Your subscription is ${subscription.status.toLowerCase()}. Please update your billing to continue.`
      );
    }

    // ── Create the request ──
    const request = await this.repository.create({ ...data, clientId });

    // ── Notify the advisor assigned to this client ──
    // ClientAssignment.clientId references Subscription.id, so first find the user's subscription
    const userSubscription = await this.subscriptionsRepository.findOne({ userId: clientId });
    if (userSubscription) {
      const activeAssignment = await this.assignmentsRepository.findActiveByClient(userSubscription.id);
      if (activeAssignment) {
        const advisorRecord = await prisma.advisor.findUnique({
          where: { id: activeAssignment.advisorId },
          select: { userId: true },
        });
        if (advisorRecord) {
          await this.notificationsRepository.create({
            userId: advisorRecord.userId,
            title: 'New Service Request',
            message: `A new ${serviceType.replace(/_/g, ' ')} request has been submitted.`,
            type: 'INFO' as NotificationType,
          });
        }
      }
    }

    return request;
  }

  async update(id: string, data: Partial<ServiceRequest>, _actorId: string): Promise<ServiceRequest> {
    await this.findById(id);
    return this.repository.update(id, data);
  }

  async respond(
    id: string,
    status: RequestStatus,
    advisorResponse?: string,
    actorUserId?: string,
  ): Promise<ServiceRequest> {
    const existing = await this.findById(id);

    // ── Enforce valid lifecycle transitions ──
    const validTransitions: Record<string, RequestStatus[]> = {
      PENDING: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
      ACCEPTED: ['COMPLETED', 'CANCELLED'],
      REJECTED: [],
      COMPLETED: [],
      CANCELLED: [],
    };

    const allowed = validTransitions[existing.status] || [];
    if (!allowed.includes(status)) {
      throw new ValidationError(
        `Cannot transition from ${existing.status} to ${status}.`
      );
    }

    const updated = await this.repository.update(id, {
      status,
      ...(advisorResponse ? { advisorResponse } : {}),
    });

    // ── Create AdvisoryNote logging the advisor's response ──
    // ServiceRequest.advisorId is the Advisor.id, clientId is User.id
    if (advisorResponse || status !== 'CANCELLED') {
      const noteTitle = status === 'ACCEPTED'
        ? `Request Accepted: ${existing.serviceType.replace(/_/g, ' ')}`
        : status === 'COMPLETED'
          ? `Request Completed: ${existing.serviceType.replace(/_/g, ' ')}`
          : status === 'REJECTED'
            ? `Request Declined: ${existing.serviceType.replace(/_/g, ' ')}`
            : `Request Updated: ${existing.serviceType.replace(/_/g, ' ')}`;

      const noteContent = advisorResponse
        ? `Status changed to ${status}. Advisor notes: ${advisorResponse}`
        : `Status changed to ${status}.`;

      await this.notesRepository.create({
        advisorId: existing.advisorId,
        clientId: existing.clientId,
        title: noteTitle,
        content: noteContent,
      } as Partial<AdvisoryNote>);
    }

    // ── Notifications on status transitions ──
    const clientId = existing.clientId;

    if (status === 'ACCEPTED') {
      // Notify client that request was accepted (INFO)
      await this.notificationsRepository.create({
        userId: clientId,
        title: 'Request Accepted',
        message: `Your ${existing.serviceType.replace(/_/g, ' ')} request has been accepted by your advisor.`,
        type: 'INFO' as NotificationType,
      });
    } else if (status === 'COMPLETED') {
      // Notify client that request was completed (SUCCESS)
      await this.notificationsRepository.create({
        userId: clientId,
        title: 'Request Completed',
        message: `Your ${existing.serviceType.replace(/_/g, ' ')} request has been completed. Check your advisor's response.`,
        type: 'SUCCESS' as NotificationType,
      });
    } else if (status === 'REJECTED') {
      // Notify client that request was rejected (WARNING)
      const reason = advisorResponse ? ` Reason: ${advisorResponse}` : '';
      await this.notificationsRepository.create({
        userId: clientId,
        title: 'Request Declined',
        message: `Your ${existing.serviceType.replace(/_/g, ' ')} request was declined.${reason}`,
        type: 'WARNING' as NotificationType,
      });
    }

    return updated;
  }

  async linkMeeting(id: string, meetingId: string): Promise<ServiceRequest> {
    await this.findById(id);
    return this.repository.update(id, { meetingId, status: 'ACCEPTED' });
  }

  /**
   * Creates a Meeting and links it to a ServiceRequest in one atomic operation.
   * Also creates an AdvisoryNote to log the meeting scheduling.
   */
  async scheduleMeeting(
    serviceRequestId: string,
    meetingData: {
      title: string;
      meetingDate: string;
      meetingLink?: string;
      description?: string;
      starts_at?: string;
      ends_at?: string;
    },
  ): Promise<{ serviceRequest: ServiceRequest; meeting: any }> {
    const existing = await this.findById(serviceRequestId);

    // Create the meeting
    const meeting = await this.meetingsRepository.create({
      advisorId: existing.advisorId,
      clientId: existing.clientId,
      title: meetingData.title,
      description: meetingData.description || existing.description,
      meetingDate: new Date(meetingData.meetingDate),
      meetingLink: meetingData.meetingLink || null,
      starts_at: meetingData.starts_at ? new Date(meetingData.starts_at) : null,
      ends_at: meetingData.ends_at ? new Date(meetingData.ends_at) : null,
      status: 'SCHEDULED',
    });

    // Link meeting to service request and auto-accept
    const updated = await this.repository.update(serviceRequestId, {
      meetingId: meeting.id,
      status: existing.status === 'PENDING' ? 'ACCEPTED' : existing.status,
    });

    // Create AdvisoryNote logging the scheduled meeting
    await this.notesRepository.create({
      advisorId: existing.advisorId,
      clientId: existing.clientId,
      title: `Meeting Scheduled: ${meetingData.title}`,
      content: `A meeting has been scheduled for ${new Date(meetingData.meetingDate).toLocaleString()}. Link: ${meetingData.meetingLink || 'TBD'}. ${meetingData.description ? `Notes: ${meetingData.description}` : ''}`,
    } as Partial<AdvisoryNote>);

    // Notify both parties (already done in MeetingsService.create, but we do it explicitly)
    const advisorRecord = await prisma.advisor.findUnique({
      where: { id: existing.advisorId },
      select: { userId: true },
    });
    await this.notificationsRepository.create({
      userId: existing.clientId,
      title: 'Meeting Scheduled',
      message: `A meeting "${meetingData.title}" has been scheduled for your ${existing.serviceType.replace(/_/g, ' ')} request.`,
      type: 'REMINDER' as NotificationType,
    });
    if (advisorRecord) {
      await this.notificationsRepository.create({
        userId: advisorRecord.userId,
        title: 'Meeting Scheduled',
        message: `Meeting "${meetingData.title}" scheduled with client for ${existing.serviceType.replace(/_/g, ' ')}.`,
        type: 'REMINDER' as NotificationType,
      });
    }

    return { serviceRequest: updated, meeting };
  }
}
