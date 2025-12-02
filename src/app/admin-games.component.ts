import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';
import { ModalComponent } from './components/modal.component';

@Component({
  selector: 'app-admin-games',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <div class="min-h-screen bg-slate-900 p-6 font-sans text-white">
      <div class="max-w-6xl mx-auto">
        <div class="flex justify-between items-center mb-6">
          <div class="flex items-center gap-4">
            <button (click)="goHome()" class="text-gray-400 hover:text-white text-2xl">←</button>
            <h1 class="text-3xl font-bold">Gestión de Juegos</h1>
          </div>
          <div class="flex gap-3">
            <button (click)="createGame()" class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition">
              + Crear Juego
            </button>
            <button (click)="goToWinners()" class="text-indigo-400 hover:text-indigo-300">
              Ver Ganadores
            </button>
          </div>
        </div>

        @if (loading) {
          <div class="text-center text-gray-400">Cargando juegos...</div>
        } @else if (games.length === 0) {
          <div class="text-center text-gray-400">
            <p class="mb-4">No hay juegos creados</p>
            <button (click)="createGame()" class="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg transition">
              Crear Primer Juego
            </button>
          </div>
        } @else {
          <div class="grid grid-cols-1 gap-4">
            @for (game of games; track game.id) {
              <div class="bg-slate-800 p-5 rounded-lg border border-slate-700 hover:border-slate-600 transition">
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <h3 class="text-xl font-bold">{{ game.title }}</h3>
                      <span class="text-xs bg-indigo-500/20 px-2 py-1 rounded border border-indigo-500/30">
                        {{ game.game_kind === 'lottery' ? '🎲 Sorteo' : '❓ Preguntas' }}
                      </span>
                      @if (game.avoid_winners) {
                        <span class="text-xs bg-yellow-500/20 px-2 py-1 rounded border border-yellow-500/30" title="Evita ganadores repetidos">
                          🚫 Sin repetir
                        </span>
                      }
                    </div>
                    <p class="text-sm text-gray-400 mb-3">{{ game.description }}</p>
                    <div class="flex gap-4 text-xs text-gray-500">
                      @if (game.game_kind === 'questions') {
                        <span>Ganadores por pregunta: {{ game.winners }}</span>
                      } @else {
                        <span>Total ganadores: {{ game.total_winners }}</span>
                      }
                      <span>Creado: {{ formatDate(game.created_at) }}</span>
                    </div>
                  </div>
                  
                  <div class="flex gap-2 ml-4">
                    <button (click)="hostGame(game.id)" 
                            [disabled]="game.status === 'FINISHED'"
                            [class.opacity-50]="game.status === 'FINISHED'"
                            [class.cursor-not-allowed]="game.status === 'FINISHED'"
                            class="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm transition"
                            [title]="game.status === 'FINISHED' ? 'Juego finalizado' : 'Hostear juego'">
                      {{ game.status === 'FINISHED' ? '🏁 Finalizado' : '🎮 Hostear' }}
                    </button>
                    @if (game.game_kind === 'questions') {
                      <button (click)="manageQuestions(game.id)" 
                              class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm transition"
                              title="Gestionar preguntas">
                        📝 Preguntas
                      </button>
                    }
                    <button (click)="openEditModal(game)" 
                            class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm transition"
                            title="Editar juego">
                      ✏️ Editar
                    </button>
                    <button (click)="confirmDelete(game.id, game.title)" 
                            class="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm transition"
                            title="Eliminar juego">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>

    <!-- Edit Modal -->
    <app-modal [(isOpen)]="showEditModal" 
               type="custom" 
               [title]="'Editar Juego'"
               [closeOnBackdrop]="false">
      <div class="space-y-4">
        <div>
          <label class="block text-gray-300 text-sm font-bold mb-2">Título del Juego</label>
          <input [(ngModel)]="editForm.title" type="text" 
                 class="w-full bg-slate-700 text-white border border-slate-600 rounded-lg py-3 px-4 outline-none">
        </div>

        <div>
          <label class="block text-gray-300 text-sm font-bold mb-2">Descripción</label>
          <textarea [(ngModel)]="editForm.description" rows="3" 
                    class="w-full bg-slate-700 text-white border border-slate-600 rounded-lg py-3 px-4 outline-none"></textarea>
        </div>

        <div>
          <label class="block text-gray-300 text-sm font-bold mb-2">Tipo de Juego</label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" [(ngModel)]="editForm.game_kind" value="questions" class="w-4 h-4">
              <span>❓ Preguntas y Respuestas</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" [(ngModel)]="editForm.game_kind" value="lottery" class="w-4 h-4">
              <span>🎲 Sorteo/Lotería</span>
            </label>
          </div>
        </div>

        @if (editForm.game_kind === 'questions') {
          <div>
            <label class="block text-gray-300 text-sm font-bold mb-2">Ganadores por Pregunta</label>
            <input [(ngModel)]="editForm.winners" type="number" min="1" 
                   class="w-full bg-slate-700 text-white border border-slate-600 rounded-lg py-3 px-4 outline-none">
          </div>
        }

        @if (editForm.game_kind === 'lottery') {
          <div>
            <label class="block text-gray-300 text-sm font-bold mb-2">Total de Ganadores del Sorteo</label>
            <input [(ngModel)]="editForm.total_winners" type="number" min="1" 
                   class="w-full bg-slate-700 text-white border border-slate-600 rounded-lg py-3 px-4 outline-none">
          </div>
        }

        <div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" [(ngModel)]="editForm.avoid_winners" class="w-4 h-4">
            <span class="text-gray-300 text-sm">Evitar que ganadores previos vuelvan a ganar</span>
          </label>
        </div>
      </div>

      <div modal-footer class="flex gap-3">
        <button (click)="showEditModal = false" 
                class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition">
          Cancelar
        </button>
        <button (click)="saveEdit()" 
                [disabled]="!editForm.title"
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition disabled:opacity-50">
          Guardar Cambios
        </button>
      </div>
    </app-modal>

    <!-- Delete Confirmation Modal -->
    <app-modal [(isOpen)]="showDeleteModal" 
               type="confirm" 
               [title]="'Confirmar Eliminación'"
               [message]="deleteMessage"
               [confirmLabel]="'Eliminar'"
               [cancelLabel]="'Cancelar'"
               (confirm)="executeDelete()"
               (cancel)="cancelDelete()">
    </app-modal>

    <!-- Success/Error Modal -->
    <app-modal [(isOpen)]="showMessageModal" 
               type="alert" 
               [title]="messageTitle"
               [message]="messageText">
    </app-modal>
  `
})
export class AdminGamesComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  games: any[] = [];
  loading = true;

  // Modal states
  showEditModal = false;
  showDeleteModal = false;
  showMessageModal = false;
  messageTitle = '';
  messageText = '';
  deleteMessage = '';

  // Edit form
  editForm: any = {
    id: null,
    title: '',
    description: '',
    game_kind: 'questions',
    winners: 1,
    total_winners: 3,
    avoid_winners: true
  };

  // Delete tracking
  deleteGameId: number | null = null;

  ngOnInit() {
    this.loadGames();
  }

  loadGames() {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/api/games`).subscribe({
      next: (data) => {
        this.games = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading games', err);
        this.loading = false;
      }
    });
  }

  createGame() {
    this.router.navigate(['/admin/create-game']);
  }

  openEditModal(game: any) {
    this.editForm = {
      id: game.id,
      title: game.title,
      description: game.description,
      game_kind: game.game_kind,
      winners: game.winners || 1,
      total_winners: game.total_winners || 3,
      avoid_winners: game.avoid_winners
    };
    this.showEditModal = true;
  }

  saveEdit() {
    if (!this.editForm.title || !this.editForm.id) return;

    this.http.put(`${environment.apiUrl}/api/games/${this.editForm.id}`, {
      title: this.editForm.title,
      description: this.editForm.description,
      game_kind: this.editForm.game_kind,
      winners: this.editForm.game_kind === 'questions' ? this.editForm.winners : null,
      total_winners: this.editForm.game_kind === 'lottery' ? this.editForm.total_winners : null,
      avoid_winners: this.editForm.avoid_winners
    }).subscribe({
      next: () => {
        this.showEditModal = false;
        this.showMessage('Éxito', 'Juego actualizado exitosamente');
        this.loadGames();
      },
      error: (err) => {
        this.showMessage('Error', 'Error al actualizar juego: ' + err.message);
      }
    });
  }

  confirmDelete(gameId: number, title: string) {
    this.deleteGameId = gameId;
    this.deleteMessage = `¿Estás seguro de eliminar el juego "${title}"?\nEsta acción no se puede deshacer.`;
    this.showDeleteModal = true;
  }

  executeDelete() {
    if (!this.deleteGameId) return;

    this.http.delete(`${environment.apiUrl}/api/games/${this.deleteGameId}`).subscribe({
      next: () => {
        this.showMessage('Éxito', 'Juego eliminado exitosamente');
        this.loadGames();
      },
      error: (err) => {
        this.showMessage('Error', 'Error al eliminar juego: ' + err.message);
      }
    });
  }

  cancelDelete() {
    this.deleteGameId = null;
  }

  showMessage(title: string, text: string) {
    this.messageTitle = title;
    this.messageText = text;
    this.showMessageModal = true;
  }

  hostGame(gameId: number) {
    this.router.navigate(['/admin/host', gameId]);
  }

  manageQuestions(gameId: number) {
    this.router.navigate(['/admin/game', gameId, 'questions']);
  }

  goToWinners() {
    this.router.navigate(['/admin/winners']);
  }

  goHome() {
    this.router.navigate(['/']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
