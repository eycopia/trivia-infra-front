import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule], // <--- Importamos FormsModule aquí
  template: `
    <div class="min-h-screen bg-slate-950 flex items-center justify-center font-sans">
      <div class="bg-slate-900 p-8 rounded-2xl border border-slate-800 w-full max-w-sm shadow-2xl text-center">

        <div class="mb-6">
          <div class="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🔐</div>
          <h2 class="text-white text-2xl font-bold">Acceso Organizador</h2>
          <p class="text-slate-400 text-sm mt-1">Ingresa la clave maestra</p>
        </div>

        <!-- Input Password -->
        <input type="password"
               [(ngModel)]="password"
               (keyup.enter)="login()"
               class="w-full mb-6 p-4 rounded-xl bg-slate-800 text-white border border-slate-700 text-center tracking-[0.5em] text-xl focus:outline-none focus:border-indigo-500 transition placeholder:tracking-normal placeholder:text-sm"
               placeholder="Contraseña">

        <button (click)="login()"
                class="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition shadow-lg shadow-indigo-500/20">
          INGRESAR
        </button>

        <!-- Bloque @if para el error -->
        @if (error) {
          <div class="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-pulse">
            <p class="text-red-400 text-sm font-medium">{{ error }}</p>
          </div>
        }
      </div>
    </div>
  `
})
export class AdminLoginComponent {
  // Inyección moderna
  private http = inject(HttpClient);
  private router = inject(Router);

  password = '';
  error = '';

  login() {
    if (!this.password) return;

    this.http.post<any>(`${environment.apiUrl}/api/admin-login`, { password: this.password })
      .subscribe({
        next: (res) => {
          if (res.success) {
            localStorage.setItem('admin_token', res.admin_token);
            this.router.navigate(['/admin/games']);
          }
        },
        error: () => {
          this.error = 'Contraseña incorrecta';
          // Borrar error a los 3 segundos
          setTimeout(() => this.error = '', 3000);
        }
      });
  }
}
