import { LandingController } from '../controllers/LandingController';
import { Router } from 'express';

export const router: Router = Router();

/**
 * Controllers (route handlers).
 */
const landingController = new LandingController();

/**
 * Route definitions
 */
router.get('/', landingController.renderView);
