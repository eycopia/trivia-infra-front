import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';
import { ModalComponent } from './components/modal.component';

@Component({
  selector: 'app-admin-winners',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <div class="min-h-screen bg-slate-900 p-6 font-sans text-white">
      <div class="max-w-6xl mx-auto">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold">Lista de Ganadores</h1>
            <button (click)="goBack()" class="text-gray-400 hover:text-white">Volver</button>
        </div>

        <!-- Search and Pagination Controls -->
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div class="w-full md:w-1/3">
                <input type="text" 
                       [(ngModel)]="searchTerm" 
                       (keyup.enter)="search()"
                       placeholder="Buscar por matrícula/extra..." 
                       class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500">
            </div>
            <div class="flex items-center gap-2">
                <button (click)="changePage(currentPage - 1)" [disabled]="currentPage === 1" class="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    Anterior
                </button>
                <span class="text-gray-400">Página {{ currentPage }} de {{ totalPages }}</span>
                <button (click)="changePage(currentPage + 1)" [disabled]="currentPage === totalPages" class="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    Siguiente
                </button>
            </div>
        </div>
        
        <div class="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
          <table class="w-full text-left">
            <thead class="bg-slate-700">
              <tr>
                <th class="p-4">ID</th>
                <th class="p-4">Jugador</th>
                <th class="p-4">Juego</th>
                <th class="p-4">Pregunta</th>
                <th class="p-4">Estado</th>
                <th class="p-4">Acción</th>
              </tr>
            </thead>
            <tbody>
              @for (winner of winners; track winner.id) {
                <tr class="border-t border-slate-700 hover:bg-slate-700/50">
                  <td class="p-4">{{ winner.id }}</td>
                  <td class="p-4">
                    <div class="font-bold">{{ winner.player_name }}</div>
                    <div class="text-xs text-gray-400">{{ winner.player_extra }}</div>
                  </td>
                  <td class="p-4">
                    <div class="font-semibold">{{ winner.game_title || 'Juego #' + winner.game_id }}</div>
                    <div class="text-xs text-gray-400">ID: {{ winner.game_id }}</div>
                  </td>
                  <td class="p-4">
                    <div class="max-w-xs truncate" title="{{ winner.question_text }}">
                        {{ winner.question_text || 'Pregunta #' + (winner.question_idx + 1) }}
                    </div>
                  </td>
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
                    <td colspan="6" class="p-8 text-center text-gray-400">No hay ganadores registrados.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Error Modal -->
    <app-modal [(isOpen)]="showMessageModal" 
               type="alert" 
               [title]="messageTitle"
               [message]="messageText">
    </app-modal>
  `
})
export class AdminWinnersComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  winners: any[] = [];

  // Pagination & Search
  searchTerm = '';
  currentPage = 1;
  pageSize = 50;
  totalItems = 0;
  totalPages = 1;

  // Modal state
  showMessageModal = false;
  messageTitle = '';
  messageText = '';

  ngOnInit() {
    this.loadWinners();
  }

  loadWinners() {
    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };
    if (this.searchTerm) {
      params.search = this.searchTerm;
    }

    this.http.get<any>(`${environment.apiUrl}/api/winners`, { params }).subscribe({
      next: (response) => {
        this.winners = response.items;
        this.totalItems = response.total;
        this.totalPages = response.totalPages;
        this.currentPage = response.page;
      },
      error: (err) => console.error(err)
    });
  }

  search() {
    this.currentPage = 1;
    this.loadWinners();
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadWinners();
  }

  markClaimed(id: number) {
    this.http.post(`${environment.apiUrl}/api/winners/${id}/claim`, {}).subscribe({
      next: () => this.loadWinners(),
      error: (err) => {
        this.messageTitle = 'Error';
        this.messageText = 'Error: ' + err.message;
        this.showMessageModal = true;
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/games']);
  }
}
