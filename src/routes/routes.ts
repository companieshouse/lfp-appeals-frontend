import { HomeController } from '../controllers/HomeController';
import { Router } from 'express';

export const router: Router = Router();

/**
 * Controllers (route handlers).
 */
const homeController = new HomeController();

/**
 * Route definitions
 */
router.get('/', homeController.sayHello);
