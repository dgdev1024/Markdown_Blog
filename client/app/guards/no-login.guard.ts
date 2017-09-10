import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { LoginService } from '../services/login.service';

@Injectable()
export class NoLoginGuard implements CanActivate {
  constructor(
    private routerService: Router,
    private loginService: LoginService
  ) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Activate this route if there is no valid login token in local storage.
    if (this.loginService.checkToken() === true) {
      this.routerService.navigate([ '/user/dashboard' ]);
      return false;
    }

    return true;
  }
}
