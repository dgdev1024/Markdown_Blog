import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Http } from '@angular/http';
import { FlashService, FlashType } from '../flash.service';

@Component({
  selector: 'app-verify',
  template: '',
  styles: []
})
export class VerifyComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: Http,
    private flash: FlashService
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.http.get(`/api/user/verify/${params['verifyId']}`)
        .subscribe(
          response => {
            const {message} = response.json();
            this.flash.deploy(message, [], FlashType.OK);
            this.router.navigateByUrl('/');
          },

          error => {
            const {message} = error.json().error;
            this.flash.deploy(message, [], FlashType.Error);
            this.router.navigateByUrl('/');
          }
        );
    });
  }

}
