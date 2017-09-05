import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as marked from 'marked';
import { AuthService } from '../auth.service';
import { BlogService } from '../blog.service';
import { FlashService, FlashType } from '../flash.service';

@Component({
  selector: 'app-edit-blog',
  templateUrl: 'edit-blog.component.html',
  styles: []
})
export class EditBlogComponent implements OnInit {

  private blogId: string = '';
  private title: string = '';
  private body: string = '';
  private keywords: string = '';
  private parsed: SafeHtml = '';

  constructor(
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private blog: BlogService,
    private flash: FlashService
  ) { }

  onBodyChanged () {
    this.parsed = this.sanitizer.bypassSecurityTrustHtml(marked(this.body, { sanitize: true }));
  }

  onFormSubmit (ev) {
    ev.preventDefault();

    this.blog.updateBlog(this.blogId, this.title, this.body, this.keywords).subscribe(
      response => {
        const { message } = response.json();
        this.flash.deploy(message, [], FlashType.OK);
        this.router.navigate([ `/blog/view/${this.blogId}` ]);
      },

      error => {
        const { status, message } = error.json().error;
        this.flash.deploy(message, [], FlashType.Error);
        if (status === 401) {
          this.router.navigate([ '/user/login' ], { queryParams: { returnUrl: '/blog/create' }});
        }
      }
    );
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.blogId = params['blogId'];

      this.blog.viewBlog(this.blogId).subscribe(
        response => {
          const { authorId, title, keywords, body } = response.json();
          const { id } = this.auth.getToken();

          if (id && id === authorId) {
            this.title = title;
            this.body = body;
            this.keywords = keywords;
            this.parsed = this.sanitizer.bypassSecurityTrustHtml(marked(this.body, { sanitize: true }));
          } else {
            this.flash.deploy('You are not the author of this blog!', [], FlashType.Error);
            this.router.navigate([ `/blog/view/${this.blogId}` ], { replaceUrl: true });
          }
        },

        error => {
          const { message } = error.json().error;

          this.flash.deploy(message, [], FlashType.Error);
          this.router.navigate([ '/' ], { replaceUrl: true });
        }
      )
    });
  }

}
