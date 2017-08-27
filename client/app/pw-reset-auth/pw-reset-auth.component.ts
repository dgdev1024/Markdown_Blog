import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { FlashService, FlashType } from '../flash.service';

@Component({
  selector: 'app-pw-reset-auth',
  templateUrl: 'pw-reset-auth.component.html',
  styles: []
})
export class PwResetAuthComponent implements OnInit {

  private tokenId: string = '';
  private authCode: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: Http,
    private flash: FlashService
  ) { }

  onFormSubmit (ev) {
    ev.preventDefault();

    this.http.post(`/api/user/authenticatePasswordReset/${this.tokenId}`, {
      authenticateCode: this.authCode
    }).subscribe(
      response => {
        const { message } = response.json();
        this.flash.deploy(message, [], FlashType.OK);
        this.router.navigateByUrl(`/user/changePassword/${this.tokenId}`);
      },

      error => {
        const { message } = error.json().error;
        this.flash.deploy(message, [], FlashType.Error);
      }
    );
  }

  ngOnInit() {
    this.route.params.subscribe(params => this.tokenId = params['tokenId']);
  }

}
