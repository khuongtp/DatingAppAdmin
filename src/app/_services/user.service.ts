import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Subject } from 'rxjs';

import { environment } from '../../environments/environment';
import { Pagination } from '../shared/pagination';
import { User } from '../_models';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userSubject: BehaviorSubject<User>;

  usersChanged = new Subject<User[]>();
  paginationChanged = new Subject<Pagination>();
  statusCountsChanged = new Subject<number[]>();

  constructor(
    private http: HttpClient,
    private accountService: AuthService
  ) {
    this.accountService.user.subscribe((user) => {
      this.userSubject = new BehaviorSubject<User>(user);
    });
  }

  getPagination(pageNumber?, pageSize?, userParams?) {
    const params = this.requestParams(pageNumber, pageSize, userParams);

    return this.http
      .get<User[]>(`${environment.apiUrl}/admin/users`, {
        observe: 'response',
        params,
      })
      .subscribe((response) => {
        this.usersChanged.next(response.body);
        this.paginationChanged.next(
          JSON.parse(response.headers.get('Pagination'))
        );
      });
  }

  getUser(id) {
    return this.http.get(environment.apiUrl + 'users/' + id);
  }

  update(id, params) {
    return this.http.put(`${environment.apiUrl}/users/${id}`, params).pipe(
      map((user: User) => {
        // Update the current account if it was updated
        if (user.id === this.userSubject.value.id) {
          // Publish updated account to subscribers
          user = { ...this.userSubject.value, ...user };
          this.userSubject.next(user);
        }
        return user;
      })
    );
  }

  getStatusCounts() {
    return this.http
      .get<number[]>(environment.apiUrl + 'users/status')
      .subscribe((statusCounts) => {
        this.statusCountsChanged.next(statusCounts);
      });
  }

  requestParams(pageNumber?, pageSize?, userParams?) {
    let params = new HttpParams();

    if (pageNumber != null && pageSize != null) {
      params = params.append('pageNumber', pageNumber);
      params = params.append('pageSize', pageSize);
    }
    if (userParams != null) {
      params = params.append('knownAs', userParams.knownAs);
      params = params.append('gender', userParams.gender);
      params = params.append('minAge', userParams.minAge);
      params = params.append('maxAge', userParams.maxAge);
      params = params.append('verification', userParams.verification);
      params = params.append('status', userParams.status);
      params = params.append('orderBy', userParams.orderBy);
    }

    return params;
  }
}