import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import NewsAdmin from '@/components/admin/NewsAdmin';

vi.stubGlobal('fetch', vi.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve([]) }) as unknown as Promise<Response>
));

describe('NewsAdmin', () => {
  it('renders header and actions', async () => {
    render(<NewsAdmin />);
    expect(await screen.findByText('Новости')).toBeTruthy();
  });
});
