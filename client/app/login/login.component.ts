import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { AuthService } from '../auth.service';
import { FlashService, FlashType } from '../flash.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.component.html',
  styles: []
})
export class LoginComponent implements OnInit {

  private returnUrl: string = '';
  private emailAddress: string = '';
  private password: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: Http,
    private auth: AuthService,
    private flash: FlashService
  ) { }

  onFormSubmit (ev) {
    ev.preventDefault();

    this.auth.attemptLogin(this.emailAddress, this.password).subscribe(
      () => {
        this.flash.deploy('You are now logged in.', [], FlashType.OK);
        this.router.navigateByUrl(this.returnUrl);
      },

      error => {
        const { message } = error.json().error;
        this.flash.deploy(message, [], FlashType.Error);
      }
    );
  }

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

}
