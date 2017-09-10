import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { LoginService } from '../services/login.service';

@Injectable()
export class LoginGuard implements CanActivate {
  constructor (
    private routerService: Router,
    private loginService: LoginService
  ) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Activate the route if there is a valid login token in local storage.
    if (this.loginService.checkToken() === false) {
      // If there isn't, then redirect the user to the login page, and
      // store the intended destination URL as the return URL.
      this.routerService.navigate(
        [ '/user/login' ],
        {
          queryParams: {
            returnUrl: state.url
          }
        }
      );

      // Guard check failed. Return false.
      return false;
    }

    return true;
  }
}
