
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { BadgeComponent } from '../../../ui/badge/badge.component';
import { AvatarTextComponent } from '../../../ui/avatar/avatar-text.component';
import { CheckboxComponent } from '../../../form/input/checkbox.component';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../../environments/environment';

type SaleRow = {
  id: number;
  saleNumber?: string;
  saleDate?: string;
  total?: number | string;
  status?: string;
  customer?: {
    name?: string;
    email?: string;
  } | null;
  items?: Array<{
    product?: {
      name?: string;
    } | null;
  }>;
};

@Component({
  selector: 'app-basic-table-two',
  imports: [
    BadgeComponent,
    AvatarTextComponent,
    CheckboxComponent,
    FormsModule,
  ],
  templateUrl: './basic-table-two.component.html',
  styles: ``
})
export class BasicTableTwoComponent implements OnInit {
  tableRowData: Array<{
    id: string;
    user: { initials: string; name: string; email: string };
    avatarColor: string;
    product: { name: string; price: string; purchaseDate: string };
    status: { type: string };
    actions: { delete: boolean };
  }> = [];

  selectedRows: string[] = [];
  selectAll: boolean = false;
  currentPage = 1;
  readonly defaultItemsPerPage = 5;
  itemsPerPage = this.defaultItemsPerPage;
  pageSizeOptions = [5, 10, 15];

  constructor(private http: HttpClient) {}

  private toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  ngOnInit(): void {
    this.http
      .get<SaleRow[]>(`${environment.apiUrl}/sales`)
      .subscribe({
        next: (rows) => {
          this.tableRowData = rows.map((row) => {
            const mappedStatus =
              row.status === 'CONFIRMED' || row.status === 'COMPLETED'
                ? 'Complete'
                : row.status === 'CANCELLED' || row.status === 'REJECTED'
                ? 'Cancel'
                : 'Pending';

            return {
              id: row.saleNumber || `SALE-${row.id}`,
              user: {
                initials: (row.customer?.name || 'Walk In')
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join('')
                  .toUpperCase(),
                name: row.customer?.name || 'Walk-in Customer',
                email: row.customer?.email || '-',
              },
              avatarColor: 'brand',
              product: {
                name: row.items?.[0]?.product?.name || `${row.items?.length ?? 0} items`,
                price: `$${this.toNumber(row.total).toFixed(2)}`,
                purchaseDate: row.saleDate ? row.saleDate.slice(0, 10) : '-',
              },
              status: { type: mappedStatus },
              actions: { delete: true },
            };
          });
          this.currentPage = 1;
          this.selectedRows = [];
          this.syncSelectAllState();
        },
      });
  }

  get totalPages(): number {
    return Math.ceil(this.tableRowData.length / this.itemsPerPage);
  }

  get currentItems() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.tableRowData.slice(start, start + this.itemsPerPage);
  }

  private syncSelectAllState() {
    if (this.currentItems.length === 0) {
      this.selectAll = false;
      return;
    }

    this.selectAll = this.currentItems.every((row) => this.selectedRows.includes(row.id));
  }

  handleSelectAll() {
    const shouldSelectAll = !this.selectAll;

    if (shouldSelectAll) {
      const merged = [...this.selectedRows, ...this.currentItems.map((row) => row.id)];
      this.selectedRows = [...new Set(merged)];
    } else {
      this.selectedRows = this.selectedRows.filter(
        (id) => !this.currentItems.some((row) => row.id === id)
      );
    }

    this.syncSelectAllState();
  }

  handleRowSelect(id: string) {
    if (this.selectedRows.includes(id)) {
      this.selectedRows = this.selectedRows.filter(rowId => rowId !== id);
    } else {
      this.selectedRows = [...this.selectedRows, id];
    }

    this.syncSelectAllState();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.syncSelectAllState();
    }
  }

  setItemsPerPage(size: number) {
    this.itemsPerPage = size;
    this.currentPage = 1;
    this.syncSelectAllState();
  }

  getBadgeColor(type: string): 'success' | 'warning' | 'error' {
    if (type === 'Complete') return 'success';
    if (type === 'Pending') return 'warning';
    return 'error';
  }
}
