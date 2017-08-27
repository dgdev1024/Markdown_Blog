import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'
import { Http } from '@angular/http';
import { FlashService, FlashType } from '../flash.service';

@Component({
  selector: 'app-pw-reset-request',
  templateUrl: 'pw-reset-request.component.html',
  styles: []
})
export class PwResetRequestComponent implements OnInit {

  private emailAddress: string = '';

  constructor(
    private router: Router,
    private http: Http,
    private flash: FlashService
  ) { }

  onFormSubmit (ev) {
    ev.preventDefault();

    this.http.post('/api/user/requestPasswordReset', { emailAddress: this.emailAddress })
      .subscribe(
        response => {
          const { message, link } = response.json();
          this.flash.deploy(message, [], FlashType.OK);
          this.router.navigateByUrl(`/user/authenticatePasswordReset/${link}`);
        },

        error => {
          const { message } = error.json().error;
          this.flash.deploy(message, [], FlashType.Error);
        }
      );
  }

  ngOnInit() {
  }

}
