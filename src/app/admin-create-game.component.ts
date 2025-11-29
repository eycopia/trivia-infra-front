import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';
import { ModalComponent } from './components/modal.component';

@Component({
  selector: 'app-admin-create-game',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <div class="min-h-screen bg-slate-900 p-6 font-sans text-white">
      <div class="max-w-2xl mx-auto">
        <div class="flex justify-between items-center mb-6">
            <div class="flex items-center gap-4">
                <button (click)="goBack()" class="text-gray-400 hover:text-white text-2xl">←</button>
                <h1 class="text-3xl font-bold">Crear Nuevo Juego</h1>
            </div>
        </div>
        
        <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div class="mb-4">
            <label class="block text-gray-300 text-sm font-bold mb-2">Título del Juego</label>
            <input [(ngModel)]="title" type="text" class="w-full bg-slate-700 text-white border border-slate-600 rounded-lg py-3 px-4 outline-none">
          </div>

          <div class="mb-4">
            <label class="block text-gray-300 text-sm font-bold mb-2">Descripción</label>
            <textarea [(ngModel)]="description" rows="3" class="w-full bg-slate-700 text-white border border-slate-600 rounded-lg py-3 px-4 outline-none"></textarea>
          </div>

          <div class="mb-4">
            <label class="block text-gray-300 text-sm font-bold mb-2">Tipo de Juego</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" [(ngModel)]="gameKind" value="questions" class="w-4 h-4">
                <span>❓ Preguntas y Respuestas</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" [(ngModel)]="gameKind" value="lottery" class="w-4 h-4">
                <span>🎲 Sorteo/Lotería</span>
              </label>
            </div>
          </div>

          @if (gameKind === 'questions') {
            <div class="mb-4">
              <label class="block text-gray-300 text-sm font-bold mb-2">Ganadores por Pregunta</label>
              <input [(ngModel)]="winners" type="number" min="1" class="w-full bg-slate-700 text-white border border-slate-600 rounded-lg py-3 px-4 outline-none">
              <p class="text-xs text-gray-400 mt-1">Cuántos jugadores ganan por cada pregunta</p>
            </div>
          }

          @if (gameKind === 'lottery') {
            <div class="mb-4">
              <label class="block text-gray-300 text-sm font-bold mb-2">Total de Ganadores del Sorteo</label>
              <input [(ngModel)]="totalWinners" type="number" min="1" class="w-full bg-slate-700 text-white border border-slate-600 rounded-lg py-3 px-4 outline-none">
              <p class="text-xs text-gray-400 mt-1">Cuántos jugadores ganarán en el sorteo</p>
            </div>
          }

          <div class="mb-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" [(ngModel)]="avoidWinners" class="w-4 h-4">
              <span class="text-gray-300 text-sm">Evitar que ganadores previos vuelvan a ganar</span>
            </label>
            <p class="text-xs text-gray-400 mt-1 ml-6">
              Si está activado, jugadores que ya ganaron en otros juegos no podrán ganar de nuevo
            </p>
          </div>

          <button (click)="createGame()" 
                  [disabled]="!title"
                  class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition disabled:opacity-50">
            Crear Juego
          </button>
        </div>
      </div>
    </div>

    <!-- Success/Error Modal -->
    <app-modal [(isOpen)]="showMessageModal" 
               type="alert" 
               [title]="messageTitle"
               [message]="messageText"
               (close)="onModalClose()">
    </app-modal>
  `
})
export class AdminCreateGameComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  title = '';
  description = '';
  gameKind: 'questions' | 'lottery' = 'questions';
  winners = 1;
  totalWinners = 3;
  avoidWinners = true;

  // Modal state
  showMessageModal = false;
  messageTitle = '';
  messageText = '';
  navigateOnClose = false;

  createGame() {
    if (!this.title) return;

    this.http.post(`${environment.apiUrl}/api/games`, {
      title: this.title,
      description: this.description,
      game_kind: this.gameKind,
      winners: this.gameKind === 'questions' ? this.winners : null,
      total_winners: this.gameKind === 'lottery' ? this.totalWinners : null,
      avoid_winners: this.avoidWinners
    }).subscribe({
      next: () => {
        this.messageTitle = 'Éxito';
        this.messageText = 'Juego creado exitosamente';
        this.navigateOnClose = true;
        this.showMessageModal = true;
      },
      error: (err) => {
        this.messageTitle = 'Error';
        this.messageText = 'Error al crear juego: ' + err.message;
        this.showMessageModal = true;
      }
    });
  }

  onModalClose() {
    if (this.navigateOnClose) {
      this.router.navigate(['/admin/games']);
    }
  }

  goBack() {
    this.router.navigate(['/admin/games']);
  }
}
