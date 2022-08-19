import { Handler } from 'express';

  /**
   * Populates variables for use in templates that are used on multiple pages.
   * All variables in res.locals will be availble for use in templates.
   * e.g. res.locals.userEmail can be used as {{userEmail}} in the template.
   *
   * @param req http request
   * @param res http response
   * @param next the next handler in the chain
   */
  export const commonTemplateVariablesMiddleware: Handler = (req, res, next) => {
      const session = req.session;

      // Populate user email for use in signout bar.
      const email = session?.data?.signin_info?.user_profile?.email;
      if (email !== undefined) {
          res.locals.userEmail = email;
      }

      next();
    };
