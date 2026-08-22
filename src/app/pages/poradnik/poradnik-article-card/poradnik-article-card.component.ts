import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PoradnikArticle } from '../../../shared/models/poradnik-article.model';

@Component({
  selector: 'app-poradnik-article-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './poradnik-article-card.component.html',
  styleUrls: ['./poradnik-article-card.component.css']
})
export class PoradnikArticleCardComponent {
  @Input({ required: true }) article!: PoradnikArticle;
  @Input() lazyImage = true;
}
