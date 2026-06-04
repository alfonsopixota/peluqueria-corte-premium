import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private baseUrl = environment.apiUrl;

  private headers() {
    const token = this.auth.token();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  get<T>(path: string) {
    return this.http.get<T>(`${this.baseUrl}${path}`, { headers: this.headers() });
  }

  post<T>(path: string, body: unknown) {
    return this.http.post<T>(`${this.baseUrl}${path}`, body, { headers: this.headers() });
  }

  patch<T>(path: string, body: unknown) {
    return this.http.patch<T>(`${this.baseUrl}${path}`, body, { headers: this.headers() });
  }

  delete<T>(path: string) {
    return this.http.delete<T>(`${this.baseUrl}${path}`, { headers: this.headers() });
  }
}
