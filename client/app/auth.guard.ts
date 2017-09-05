import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor (private router: Router, private auth: AuthService) {}

  canActivate (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.auth.checkToken() === true) {
      return true;
    }

    this.router.navigate([ '/user/login' ], { queryParams: { returnUrl: state.url }});
    return false;
  }
}
