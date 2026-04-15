
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { BadgeComponent } from '../../../ui/badge/badge.component';
import { environment } from '../../../../../../environments/environment';
import { paginationPageSizeOptions } from '../../../../libs/pagination';
import { PaginationComponent } from '../pagination/pagination';

type UserRow = {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
};

@Component({
  selector: 'app-basic-table-one',
  imports: [
    BadgeComponent,
    PaginationComponent
  ],
  templateUrl: './basic-table-one.component.html',
  styles: ``
})
export class BasicTableOneComponent implements OnInit {
  tableData: Array<{
    id: number;
    user: { image: string; name: string; role: string };
    projectName: string;
    team: { images: string[] };
    budget: string;
    status: string;
  }> = [];

  currentPage = 1;
  itemsPerPage = paginationPageSizeOptions[0];
  pageSizeOptions = paginationPageSizeOptions;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const avatarPool = [
      '/images/user/user-17.jpg',
      '/images/user/user-18.jpg',
      '/images/user/user-20.jpg',
      '/images/user/user-21.jpg',
    ];

    this.http
      .get<UserRow[]>(`${environment.apiUrl}/users`)
      .subscribe({
        next: (rows) => {
          this.tableData = rows.map((row, index) => ({
            id: row.id,
            user: {
              image: avatarPool[index % avatarPool.length],
              name: `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() || 'Unknown User',
              role: row.role || 'USER',
            },
            projectName: row.email || '-',
            team: { images: [] as string[] },
            budget: row.isActive ? 'Active' : 'Inactive',
            status: row.isActive ? 'Active' : 'Cancel',
          }));
          this.currentPage = 1;
        },
      });
  }

  get totalPages(): number {
    return Math.ceil(this.tableData.length / this.itemsPerPage);
  }

  get paginatedData() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.tableData.slice(start, start + this.itemsPerPage);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  setItemsPerPage(size: number) {
    this.itemsPerPage = size;
    this.currentPage = 1;
  }

  getBadgeColor(status: string): 'success' | 'warning' | 'error' {
    if (status === 'Active') return 'success';
    if (status === 'Pending') return 'warning';
    return 'error';
  }
}
