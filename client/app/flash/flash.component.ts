import { Component, OnInit } from '@angular/core';
import { FlashService, FlashType } from '../flash.service';

@Component({
  selector: 'app-flash',
  templateUrl: 'flash.component.html',
  styles: []
})
export class FlashComponent implements OnInit {

  constructor (private flash: FlashService) {
  }

  ngOnInit() {
  }

}
