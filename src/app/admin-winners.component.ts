import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-admin-winners',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="min-h-screen bg-slate-900 p-6 font-sans text-white">
      <div class="max-w-4xl mx-auto">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold">Lista de Ganadores</h1>
            <button (click)="goBack()" class="text-gray-400 hover:text-white">Volver</button>
        </div>
        
        <div class="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
          <table class="w-full text-left">
            <thead class="bg-slate-700">
              <tr>
                <th class="p-4">ID</th>
                <th class="p-4">Jugador</th>
                <th class="p-4">Juego ID</th>
                <th class="p-4">Pregunta IDX</th>
                <th class="p-4">Estado</th>
                <th class="p-4">Acción</th>
              </tr>
            </thead>
            <tbody>
              @for (winner of winners; track winner.id) {
                <tr class="border-t border-slate-700 hover:bg-slate-700/50">
                  <td class="p-4">{{ winner.id }}</td>
                  <td class="p-4 font-bold">{{ winner.player_name }}</td>
                  <td class="p-4">{{ winner.game_id }}</td>
                  <td class="p-4">{{ winner.question_idx }}</td>
                  <td class="p-4">
                    <span [class]="winner.claimed ? 'text-green-400' : 'text-yellow-400'">
                        {{ winner.claimed ? 'Entregado' : 'Pendiente' }}
                    </span>
                  </td>
                  <td class="p-4">
                    @if (!winner.claimed) {
                        <button (click)="markClaimed(winner.id)" class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm">
                            Marcar Entregado
                        </button>
                    }
                  </td>
                </tr>
              }
              @if (winners.length === 0) {
                <tr>
                    <td colspan="6" class="p-8 text-center text-gray-400">No hay ganadores registrados aún.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AdminWinnersComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  winners: any[] = [];

  ngOnInit() {
    this.loadWinners();
  }

  loadWinners() {
    const token = localStorage.getItem('admin_token');
    const headers = new HttpHeaders().set('Authorization', token || '');

    this.http.get<any[]>(`${environment.apiUrl}/api/winners`, { headers }).subscribe({
      next: (data) => this.winners = data,
      error: (err) => console.error(err)
    });
  }

  markClaimed(id: number) {
    const token = localStorage.getItem('admin_token');
    const headers = new HttpHeaders().set('Authorization', token || '');

    this.http.post(`${environment.apiUrl}/api/winners/${id}/claim`, {}, { headers }).subscribe({
      next: () => this.loadWinners(),
      error: (err) => alert('Error: ' + err.message)
    });
  }

  goBack() {
    this.router.navigate(['/admin/create-game']);
  }
}
