import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as marked from 'marked';
import { BlogService } from '../blog.service';
import { FlashService, FlashType } from '../flash.service';

const TDM_BLOG_DRAFT = '-tdm-blog-draft';

@Component({
  selector: 'app-create-blog',
  templateUrl: 'create-blog.component.html',
  styles: []
})
export class CreateBlogComponent implements OnInit, OnDestroy {

  private title: string = '';
  private body: string = '';
  private keywords: string = '';
  private parsed: SafeHtml = '';
  private created: boolean = false;

  private saveBlogDraft () {
    if (this.title || this.body || this.keywords) {
      localStorage.setItem(TDM_BLOG_DRAFT, JSON.stringify({
        title: this.title,
        body: this.body,
        keywords: this.keywords
      }));
    }
  }

  private retrieveBlogDraft () {
    const draft = localStorage.getItem(TDM_BLOG_DRAFT);
    if (draft) {
      const { title, body, keywords } = JSON.parse(draft);
      this.title = title || '';
      this.body = body || '';
      this.keywords = keywords || '';
      this.parsed = this.sanitizer.bypassSecurityTrustHtml(marked(this.body, { sanitize: true }));

      this.flash.deploy('We found a draft of a blog you were writing and restored it for you.', [], FlashType.OK);
    }
  }

  private clearBlogDraft () {
    localStorage.removeItem(TDM_BLOG_DRAFT);
  }

  constructor(
    private sanitizer: DomSanitizer,
    private router: Router,
    private blog: BlogService,
    private flash: FlashService
  ) { }

  onBodyChanged () {
    this.parsed = this.sanitizer.bypassSecurityTrustHtml(marked(this.body, { sanitize: true }));
  }

  onFormSubmit (ev) {
    ev.preventDefault();

    this.blog.createBlog(this.title, this.keywords, this.body).subscribe(
      response => {
        const { message, id } = response.json();
        this.created = true;
        this.flash.deploy(message, [], FlashType.OK);
        this.router.navigate([ `/blog/view/${id}` ]);
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
    this.retrieveBlogDraft();
  }

  ngOnDestroy() {
    if (this.created === false) {
      this.saveBlogDraft();
    } else {
      this.clearBlogDraft();
    }
  }

}
