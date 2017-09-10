import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { FlashService, FlashType } from '../../services/flash.service';

@Component({
  selector: 'app-verify',
  template: '',
  styles: []
})
export class VerifyComponent implements OnInit {

  constructor(
    private activatedRoute: ActivatedRoute,
    private routerService: Router,
    private userService: UserService,
    private flashService: FlashService
  ) { }

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      const verifyId = params['verifyId'] || '';

      this.userService.verifyLocal(verifyId).subscribe(
        response => {
          const { message } = response.json();

          this.flashService.deploy(message, [], FlashType.OK);
          this.routerService.navigate([ '/' ], { replaceUrl: true });
        },

        error => {
          const { message } = error.json().error;

          this.flashService.deploy(message, [], FlashType.Error);
          this.routerService.navigate([ '/' ], { replaceUrl: true });
        }
      )
    });
  }

}
