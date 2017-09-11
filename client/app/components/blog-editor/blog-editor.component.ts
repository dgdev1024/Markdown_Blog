import { Component, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeHtml, Title } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { BlogService } from '../../services/blog.service';
import { LoginService } from '../../services/login.service';
import { FlashService, FlashType } from '../../services/flash.service';
import * as marked from 'marked';

const TDM_NEW_BLOG_DRAFT: string  = '-tdm-new-blog-draft';

@Component({
  selector: 'app-blog-editor',
  templateUrl: './blog-editor.component.html',
  styles: []
})
export class BlogEditorComponent implements OnInit, OnDestroy {

  private mode: string = '';
  private blogId: string = '';
  private title: string = '';
  private body: string = '';
  private keywords: string = '';
  private parsed: SafeHtml = null;

  constructor(
    private titleService: Title,
    private domSanitizer: DomSanitizer,
    private activatedRoute: ActivatedRoute,
    private routerService: Router,
    private blogService: BlogService,
    private userService: UserService,
    private loginService: LoginService,
    private flashService: FlashService
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      this.mode = params['mode'];
      this.blogId = params['blogId'] || '';
      if (this.blogId === '') { this.mode = 'create'; }

      if (this.mode === 'edit') {
        this.blogService.viewBlog(this.blogId).subscribe(
          response => {
            const { authorId, title, body, keywords } = response.json();
            const token = this.loginService.getToken();

            if (!token) {
              this.flashService.deploy('You need to be logged in before you can edit a blog.', [], FlashType.Error);
              this.routerService.navigate([ '/user/login' ], { queryParams: { returnUrl: `'/blog/editor?mode=edit&blogId=${this.blogId}` }});
              return;
            }

            if (token.id !== authorId) {
              this.flashService.deploy('You are not the author of this blog!', [], FlashType.Error);
              this.routerService.navigate([ `/blog/view/${this.blogId}` ], { replaceUrl: true });
              return;
            }

            this.title = title;
            this.body = body;
            this.keywords = keywords;
            this.parsed = this.domSanitizer.bypassSecurityTrustHtml(marked(this.body, { sanitize: true }));
            this.titleService.setTitle('Edit Blog - The Daily Markdown');
          },

          error => {
            const { message } = error.json().error;

            this.flashService.deploy(message, [], FlashType.Error);
            this.routerService.navigate([ '/' ], { replaceUrl: true });
          }
        );
      }
      else {
        this.titleService.setTitle('Create Blog - The Daily Markdown');
        const draftString = localStorage.getItem(TDM_NEW_BLOG_DRAFT);
        if (draftString) {
          const draft = JSON.parse(draftString);
          this.title = draft.title || '';
          this.body = draft.body || '';
          this.keywords = draft.keywords || '';
          this.parsed = this.domSanitizer.bypassSecurityTrustHtml(marked(this.body, { sanitize: true }));
          this.flashService.deploy('We found a blog draft and restored it for you.', [], FlashType.OK);
        }
      }
    });
  }

  ngOnDestroy () {
    if (this.title !== '' || this.body !== '' || this.keywords !== '') {
      let draft = {};
      if (this.title !== '') { draft['title'] = this.title; }
      if (this.body !== '') { draft['body'] = this.body; }
      if (this.keywords !== '') { draft['keywords'] = this.keywords; }
      localStorage.setItem(TDM_NEW_BLOG_DRAFT, JSON.stringify(draft));
    } else {
      localStorage.removeItem(TDM_NEW_BLOG_DRAFT);
    }
  }

  onBodyChanged () {
    this.parsed = this.domSanitizer.bypassSecurityTrustHtml(marked(this.body, { sanitize: true }));
  }

  onSubmit (ev) {
    ev.preventDefault();

    if (this.mode === 'edit') {
      this.blogService.updateBlog(this.blogId, this.title, this.body, this.keywords).subscribe(
        response => {
          const { message } = response.json();
          
          this.flashService.deploy(message, [], FlashType.OK);
          this.routerService.navigate([ `/blog/view/${this.blogId}` ], { replaceUrl: true });
        },

        error => {
          const { status, message } = error.json().error;
          
          if (status === 401) {
            this.flashService.deploy('You need to be logged in before you can use the blog editor.', [], FlashType.Error);
            this.routerService.navigate([ '/user/login' ], { queryParams: { returnUrl: `/blog/editor?mode=create` }});
          } else {
            this.flashService.deploy(message, [], FlashType.Error);
          }
        }
      );
    } else {
      this.blogService.createBlog(this.title, this.body, this.keywords).subscribe(
        response => {
          const { message, id } = response.json();

          localStorage.removeItem(TDM_NEW_BLOG_DRAFT);
          this.title = '';
          this.keywords = '';
          this.body = '';
          this.flashService.deploy(message, [], FlashType.OK);
          this.routerService.navigate([ `/blog/view/${id}` ], { replaceUrl: true });
        },

        error => {
          const { status, message } = error.json().error;

          if (status === 401) {
            this.flashService.deploy('You need to be logged in before you can use the blog editor.', [], FlashType.Error);
            this.routerService.navigate([ '/user/login' ], { queryParams: { returnUrl: `/blog/editor?mode=create` }});
          } else {
            this.flashService.deploy(message, [], FlashType.Error);
          }
        }
      );
    }
  }

}
