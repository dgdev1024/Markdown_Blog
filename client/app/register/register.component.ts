import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Http } from '@angular/http';
import { FlashService, FlashType } from '../flash.service';

@Component({
  selector: 'app-register',
  templateUrl: 'register.component.html',
  styles: []
})
export class RegisterComponent implements OnInit {

  private firstName: string = '';
  private lastName: string = '';
  private emailAddress: string = '';
  private password: string = '';
  private confirm: string = '';

  constructor(
    private router: Router,
    private http: Http,
    private flash: FlashService
  ) { }

  onFormSubmit (ev) {
    ev.preventDefault();
    console.log('testone');
    this.http.post('/api/user/register', {
      firstName: this.firstName,
      lastName: this.lastName,
      emailAddress: this.emailAddress,
      password: this.password,
      confirm: this.confirm
    }).subscribe(
      response => {
        console.log(response.json());
        const {message} = response.json();
        this.flash.deploy(message, [], FlashType.OK);
        this.router.navigateByUrl('/');
      },

      error => {
        console.log(error.json());
        const {message, details} = error.json().error;
        this.flash.deploy(message, details ? details : [], FlashType.Error);
      }
    );
  }

  ngOnInit() {
  }

}
