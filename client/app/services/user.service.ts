///
/// @file   user.service.ts
/// @brief  The service in charge of fetching user profiles.
///

import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { LoginService } from './login.service';

@Injectable()
export class UserService {

  constructor(
    private httpService: Http,
    private loginService: LoginService
  ) {}

  registerLocal (
    firstName: string,
    lastName: string,
    emailAddress: string,
    password: string,
    confirm: string
  ) {
    return this.httpService.post('/api/user/register', {
      firstName, lastName, emailAddress, password, confirm
    });
  }

  verifyLocal (verifyId: string) {
    return this.httpService.get(`/api/user/verify/${verifyId}`);
  }

  requestPasswordReset (emailAddress: string) {
    return this.httpService.post('/api/user/requestPasswordReset', { emailAddress });
  }

  authenticatePasswordReset (id: string, code: string) {
    return this.httpService.post(`/api/user/authenticatePasswordReset/${id}`, { 
      authenticateCode: code
    });
  }

  changePassword (id: string, password: string, confirm: string) {
    return this.httpService.post(`/api/user/changePassword/${id}`, {
      password, confirm
    });
  }

  fetchUserProfile (userId: string) {
    return this.httpService.get(`/api/user/profile/${userId}`);
  }

  fetchUserSubscriptions (userId: string, page: number = 0) {
    return this.httpService.get(`/api/user/subscriptions/${userId}?page=${page}`);
  }

  fetchUserBlogs (userId: string, page: number = 0) {
    return this.httpService.get(`/api/user/blogs/${userId}?page=${page}`);
  }

  subscribeToUser (targetId: string) {
    return this.httpService.put(`/api/user/subscribe/${targetId}`, {}, 
      this.loginService.buildRequestOptions());
  }

  unsubscribeFromUser (targetId: string) {
    return this.httpService.put(`/api/user/unsubscribe/${targetId}`, {},
      this.loginService.buildRequestOptions());
  }

  isUserSubscribed (userId: string, targetId: string) {
    return this.httpService.get(`/api/user/isSubscribed?userId=${userId}&targetId=${targetId}`);
  }

}
