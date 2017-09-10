///
/// @file   login.service.ts
/// @brief  The service in charge of managing our login status.
///

import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

// The name of our login token.
const TDM_TOKEN = '-tdm-token';

// The interface representing our login token.
export interface LoginToken {
  id: string,
  fullName: string,
  raw: string
}

@Injectable()
export class LoginService {

  constructor(
    private httpService: Http
  ) { }

  ///
  /// @fn     attemptLogin
  /// @brief  Attempts to log a user in.
  ///
  /// If the login attempt is successful, a login token will be sent
  /// back and saved to the browser's local storage.
  ///
  /// @param {string} emailAddress The user's email address.
  /// @param {string} password The user's password.
  ///
  /// @return An observable to be subscribed to by the calling function.
  ///
  attemptLogin (emailAddress: string, password: string) {
    // Make the request out and return it for subscription.
    return this.httpService.post('/api/user/login', {
      emailAddress, password
    }).map(response => {
      // Parse the expected response as JSON.
      const user = response.json();
      
      // Check to see if the parsed object is valid, and there is a token inside.
      if (user && user.token) {
        // Save the token inside our browser's local storage.
        localStorage.setItem(TDM_TOKEN, user.token);
      }
    });
  }

  ///
  /// @fn     getToken
  /// @brief  Fetches and parses a login token stored in local storage.
  ///
  /// @return {LoginToken} The login token stored, or null.
  ///
  getToken (): LoginToken {
    // Check local storage and see if there is a token.
    const token = localStorage.getItem(TDM_TOKEN);
    if (!token) { 
      return null; 
    }

    // A valid JWT token will have three period-separated segments.
    const segments = token.split('.');
    if (segments.length !== 3) {
      this.clearToken();
      return null;
    }

    // Exceptions can be thrown in this next part. If one is caught, then
    // clear the token and return null.
    try {
      // The second segment of the token contains our payload. Decode it
      // and parse it as JSON.
      const decoded = JSON.parse(atob(segments[1]));

      // Has the token been decoded? If so, does the token contain a valid
      // user ID, full name, email address, and expiration claim?
      if (!decoded || !decoded._id || !decoded.fullName || !decoded.emailAddress || !decoded.exp) {
        this.clearToken();
        return null;
      }

      // Is the token still fresh? Has it expired?
      if (decoded.exp <= Date.now() / 1000) {
        this.clearToken();
        return null;
      }

      // Return the decoded login token.
      return {
        id: decoded._id,
        fullName: decoded.fullName,
        raw: token
      };
    }
    catch (err) {
      this.clearToken();
      return null;
    }
  }

  ///
  /// @fn     checkToken
  /// @brief  Checks to see if there is a valid login token stored in local storage.
  ///
  /// @return {boolean} True if there is a valid login token.
  ///
  checkToken (): boolean {
    return this.getToken() !== null;
  }

  ///
  /// @fn     clearToken
  /// @brief  Upon logging out, clears the login token from local storage.
  ///
  clearToken (): void {
    localStorage.clear();
  }

  ///
  /// @fn     buildRequestOptions
  /// @brief  Builds the authorization header for requests that require user authentication.
  ///
  /// @return {RequestOptions} The compiled request options object.
  ///
  buildRequestOptions (): RequestOptions {
    const token = this.getToken();
    const bearer = token ? `Bearer ${token.raw}` : '';
    const headers = new Headers();
    const options = new RequestOptions();
    headers.append('Authorization', bearer);
    options.headers = headers;
    return options;
  }

}
