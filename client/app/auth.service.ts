import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

const TDM_TOKEN: string = '-tdm-login';

@Injectable()
export class AuthService {

  constructor (private http: Http) {}

  attemptLogin (emailAddress: string, password: string) {
    // Clear the previously existing auth token, if there is one.
    this.clearToken();

    // Make the request out and return the resulting observable, but
    // don't send it yet.
    return this.http.post('/api/user/login', { emailAddress, password })
      .map(response => {
        // Parse the expected response as JSON.
        const user = response.json();

        // Check to see if the parsed object is valid, and there is a token inside.
        if (user && user.token) {
          // Save the token inside our browser's local storage.
          localStorage.setItem(TDM_TOKEN, user.token);
        }
      });
  }

  getToken () {
    // Fetch the token from the browser's local storage.
    const jwt = localStorage.getItem(TDM_TOKEN);
    if (!jwt) { return null; }

    // Make sure the token has three period-separated segments.
    const substrings = jwt.split('.');
    if (substrings.length !== 3) {
      this.clearToken();
      return null;
    }

    try {
      // Decode and parse the payload segment of the token.
      const payload = JSON.parse(atob(substrings[1]));

      // The payload should have a user ID, a full name, and expiration claim.
      // Early out if the payload or these claims are not present.
      if (!payload || !payload._id || !payload.fullName || !payload.exp) {
        this.clearToken();
        return null;
      }

      // Check to see if the payload has expired.
      if (payload.exp <= Date.now() / 1000) {
        this.clearToken();
        return null;
      }

      // Return the ID and full name claims.
      return {
        id: payload._id,
        fullName: payload.fullName
      };
    }
    catch (err) {
      this.clearToken();
      return null;
    }
  }

  checkToken () {
    return this.getToken() !== null;
  }

  clearToken () {
    // Clear the token.
    localStorage.removeItem(TDM_TOKEN);
  }

}
