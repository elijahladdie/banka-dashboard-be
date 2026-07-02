import { SUB_CREATION_WEBHOOK_SECRET, PADDLE_API_ENV, ACTIVATION_WEBHOOK_SECRET, PADDLE_API_KEY } from "../constants/constants";
import { Paddle } from '@paddle/paddle-node-sdk';
export const PaddleCreation = new Paddle(SUB_CREATION_WEBHOOK_SECRET, { environment: PADDLE_API_ENV });
export const PaddleActivation = new Paddle(ACTIVATION_WEBHOOK_SECRET, { environment: PADDLE_API_ENV });
const  paddle = new Paddle(PADDLE_API_KEY, { environment: PADDLE_API_ENV });
export default paddle;