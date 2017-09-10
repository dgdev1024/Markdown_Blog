///
/// @file     blog.service.ts
/// @brief    The service in charge of managing our blogs.
///

import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { LoginService } from './login.service';

@Injectable()
export class BlogService {

  // Store our search query here.
  searchQuery: string = '';

  constructor(
    private httpService: Http,
    private loginService: LoginService
  ) { }

  createBlog (title: string, body: string, keywords: string) {
    return this.httpService.post('/api/blog/create', {
      title, body, keywords
    }, this.loginService.buildRequestOptions());
  }

  viewBlog (blogId: string) {
    const token = this.loginService.getToken();

    if (token) {
      return this.httpService.get(`/api/blog/view/${blogId}?as=${token.id}`);
    } else {
      return this.httpService.get(`/api/blog/view/${blogId}`);
    }
  }

  viewBlogComments (blogId: string, page: number = 0) {
    return this.httpService.get(`/api/blog/comments/${blogId}?page=${page}`);
  }

  fetchRecentBlogs (page: number = 0) {
    return this.httpService.get(`/api/blog/recent?page=${page}`);
  }

  fetchHotBlogs (page: number = 0) {
    return this.httpService.get(`/api/blog/hot?page=${page}`);
  }

  fetchBlogsByKeyword (keywords: string, page: number = 0) {
    this.searchQuery = keywords;
    return this.httpService.get(`/api/blog/search?query=${keywords}&page=${page}`);
  }

  fetchBlogsBySubscriptions (page: number = 0) {
    return this.httpService.get(`/api/blog/subscriptions?page=${page}`,
      this.loginService.buildRequestOptions());
  }

  updateBlog (blogId: string, title: string, body: string, keywords: string) {
    return this.httpService.put(`/api/blog/update/${blogId}`, {
      title, body, keywords
    }, this.loginService.buildRequestOptions());
  }

  rateBlog (blogId: string, score: number) {
    return this.httpService.put(`/api/blog/rate/${blogId}`, { score },
      this.loginService.buildRequestOptions());
  }

  commentOnBlog (blogId: string, comment: string) {
    return this.httpService.put(`/api/blog/postComment/${blogId}`, { comment },
      this.loginService.buildRequestOptions());
  }

  deleteComment (blogId: string, commentId: string) {
    return this.httpService.put(`/api/blog/deleteComment/${blogId}`, { commentId },
      this.loginService.buildRequestOptions());
  }

  deleteBlog (blogId: string) {
    return this.httpService.delete(`/api/blog/delete/${blogId}`,
      this.loginService.buildRequestOptions());
  }

}
