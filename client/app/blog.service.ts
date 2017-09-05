import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { AuthService } from './auth.service';
import { FlashService, FlashType } from './flash.service';

@Injectable()
export class BlogService {

  private buildRequestOptions () {
    const token = this.auth.getToken();
    const bearer = token ? `Bearer ${token.token}` : '';
    const headers = new Headers();
    const options = new RequestOptions();
    headers.append('Authorization', bearer);
    options.headers = headers;
    return options;
  }

  constructor(
    private http: Http,
    private auth: AuthService,
    private flash: FlashService
  ) { }

  createBlog (title: string, keywords: string, body: string) {
    // Make the request out.
    return this.http.post('/api/blog/create', {
      title,
      body,
      keywords
    }, this.buildRequestOptions());
  }

  viewBlog (blogId: string) {
    return this.http.get(`/api/blog/view/${blogId}`);
  }

  viewBlogComments (blogId: string, page: number = 0) {
    return this.http.get(`/api/blog/comments/${blogId}?page=${page}`);
  }

  fetchRecentBlogs (page: number = 0) {
    return this.http.get(`/api/blog/recent?page=${page}`);
  }

  fetchHotBlogs (page: number = 0) {
    return this.http.get(`/api/blog/hot?page=${page}`);
  }

  fetchBlogsByKeyword (query: string, page: number = 0) {
    return this.http.get(`/api/blog/search?query=${query}&page=${page}`);
  }

  fetchUserBlogs (userId: string, page: number = 0) {
    return this.http.get(`/api/user/blogs/${userId}?page=${page}`);
  }

  fetchBlogsBySubscriptions (page: number = 0) {
    return this.http.get(`/api/blog/subscriptions?page=${page}`, this.buildRequestOptions());
  }

  updateBlog (blogId: string, title: string, body: string, keywords: string) {
    return this.http.put(`/api/blog/update/${blogId}`, {
      title, body, keywords
    }, this.buildRequestOptions());
  }

  rateBlog (blogId: string, score: number) {
    return this.http.put(`/api/blog/rate/${blogId}`, { score }, this.buildRequestOptions());
  }

  commentOnBlog (blogId: string, comment: string) {
    return this.http.put(`/api/blog/postComment/${blogId}`, { comment }, this.buildRequestOptions());
  }

  deleteComment (blogId: string, commentId: string) {
    return this.http.put(`/api/blog/deleteComment/${blogId}`, { commentId }, this.buildRequestOptions());
  }

  deleteBlog (blogId: string) {
    return this.http.delete(`/api/blog/delete/${blogId}`, this.buildRequestOptions());
  }
  
  subscribeToUser (userId: string) {
    return this.http.put(`/api/user/subscribe/${userId}`, {}, this.buildRequestOptions());
  }

  unsubscribeFromUser (userId: string) {
    return this.http.put(`/api/user/unsubscribe/${userId}`, {}, this.buildRequestOptions());
  }

}
