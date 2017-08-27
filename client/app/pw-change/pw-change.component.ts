import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { FlashService, FlashType } from '../flash.service';

@Component({
  selector: 'app-pw-change',
  templateUrl: 'pw-change.component.html',
  styles: []
})
export class PwChangeComponent implements OnInit {

  private tokenId: string = '';
  private password: string = '';
  private confirm: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: Http,
    private flash: FlashService
  ) { }

  onFormSubmit (ev) {
    ev.preventDefault();

    this.http.post(`/api/user/changePassword/${this.tokenId}`, {
      password: this.password,
      confirm: this.confirm
    }).subscribe(
      response => {
        const { message } = response.json();
        this.flash.deploy(message, [], FlashType.OK);
        this.router.navigateByUrl('/');
      },

      error => {
        const { message, details } = error.json().error;
        this.flash.deploy(message, details ? details : [], FlashType.Error);
      }
    );
  }

  ngOnInit() {
    this.route.params.subscribe(params => this.tokenId = params['tokenId']);
  }

}
