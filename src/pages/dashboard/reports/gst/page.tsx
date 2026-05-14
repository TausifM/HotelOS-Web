// web/src/app/dashboard/reports/gst/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { FileText, Download, Info, Receipt, Building2, Users, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const map = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-[3px]',
    lg: 'h-10 w-10 border-4',
  };

  return <div className={`animate-spin rounded-full border-white/30 border-t-current ${map[size]}`} />;
}

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl border border-orange-100 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`border-b border-orange-100 px-5 py-4 ${className}`}>{children}</div>;
}

function CardContent({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

function SummaryPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/15 p-3 text-center backdrop-blur-sm">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-orange-100">{label}</p>
    </div>
  );
}

export default function GSTExportPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [exporting, setExporting] = useState<'json' | 'excel' | null>(null);

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['gstr1-summary', month],
    queryFn: () =>
      api
        .get('/api/gst/gstr1-summary', { params: { month } })
        .then((r) => r.data.data),
  });

  async function exportFile(type: 'json' | 'excel') {
    setExporting(type);
    try {
      const res = await api.get(`/api/gst/gstr1-${type}`, {
        params: { month },
        responseType: 'blob',
      });

      const ext = type === 'json' ? 'json' : 'xlsx';
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `GSTR1_${month}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`GSTR-1 ${type.toUpperCase()} exported!`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Export failed');
    } finally {
      setExporting(null);
    }
  }

  const monthName = useMemo(() => {
    const [y, m] = month.split('-');
    return new Date(+y, +m - 1, 1).toLocaleString('en-IN', {
      month: 'long',
      year: 'numeric',
    });
  }, [month]);

  return (
    <DashboardLayout title="GST Export">
      <div className="max-w-6xl space-y-5">
        <div className="rounded-3xl border border-orange-100 bg-gradient-to-r from-orange-50 via-rose-50 to-pink-50 p-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">GST Filing Export</h1>
          <p className="mt-1 text-sm text-slate-600">
            Generate GSTR-1 in GST portal format · File by 11th of next month
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-3xl border border-orange-200 bg-gradient-to-r from-orange-50 via-rose-50 to-pink-50 p-4 shadow-sm">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-pink-600" />
          <div>
            <p className="text-sm font-semibold text-rose-900">GSTR-1 Filing — GST Act Compliance</p>
            <p className="mt-0.5 text-xs leading-relaxed text-rose-700">
              HSN Code 9963 · Accommodation Services. GST Rates: 0% (≤₹1,000/night),
              12% (₹1,001–₹7,500/night), 18% (&gt;₹7,500/night). Due date: 11th of following month.
              Penalty: ₹200/day for late filing.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-orange-200 bg-white px-4 py-2.5 shadow-sm">
            <FileText className="h-4 w-4 text-pink-400" />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-700 outline-none"
            />
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-orange-50 disabled:opacity-60"
          >
            {isFetching ? <Spinner size="sm" /> : <RefreshCw className="h-4 w-4 text-orange-500" />}
            Refresh
          </button>

          <button
            onClick={() => exportFile('json')}
            disabled={exporting !== null}
            className="inline-flex items-center gap-2 rounded-2xl border border-pink-200 bg-pink-50 px-4 py-2.5 text-sm font-semibold text-pink-700 shadow-sm transition hover:bg-pink-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting === 'json' ? <Spinner size="sm" /> : <Download className="h-4 w-4" />}
            Export JSON (GST Portal)
          </button>

          <button
            onClick={() => exportFile('excel')}
            disabled={exporting !== null}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-200/60 transition hover:from-orange-600 hover:via-rose-600 hover:to-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting === 'excel' ? <Spinner size="sm" /> : <Download className="h-4 w-4" />}
            Export Excel
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16 text-pink-500">
            <Spinner size="lg" />
          </div>
        ) : data ? (
          <div className="space-y-5">
            <div className="rounded-3xl bg-gradient-to-br from-orange-500 via-rose-500 to-pink-500 p-6 text-white shadow-xl shadow-pink-200/50">
              <p className="mb-1 text-sm font-medium text-orange-100">GSTR-1 Summary — {monthName}</p>
              <p className="text-4xl font-black tracking-tight">{formatCurrency(data.total?.taxableValue || 0)}</p>
              <p className="mt-1 text-sm text-orange-100">
                Taxable turnover · {data.total?.invoiceCount || 0} invoices
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-4">
                <SummaryPill label="CGST" value={formatCurrency(data.total?.cgst || 0)} />
                <SummaryPill label="SGST" value={formatCurrency(data.total?.sgst || 0)} />
                <SummaryPill label="Total Tax" value={formatCurrency(data.total?.totalTax || 0)} />
                <SummaryPill label="Grand Total" value={formatCurrency(data.total?.grandTotal || 0)} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="bg-gradient-to-br from-orange-50 to-white">
                <CardContent>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold text-orange-700">{data.b2b?.length || 0}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">B2B Parties</p>
                  <p className="mt-1 text-xs text-slate-400">Corporate GST customers in selected month</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-50 to-white">
                <CardContent>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold text-pink-700">{data.b2c_invoiceCount || 0}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">B2C Invoices</p>
                  <p className="mt-1 text-xs text-slate-400">Individual guest invoices without GSTIN</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-rose-50 to-white">
                <CardContent>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold text-rose-700">{data.hsn_summary?.length || 0}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">HSN Groups</p>
                  <p className="mt-1 text-xs text-slate-400">Tax grouped by HSN/SAC codes</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">B2B (Corporate)</h3>
                    <p className="mt-0.5 text-xs text-slate-400">Registered GST customers</p>
                  </div>
                  <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">
                    {data.b2b?.length || 0} parties
                  </span>
                </CardHeader>

                <CardContent>
                  {!data.b2b?.length ? (
                    <p className="py-8 text-center text-sm text-slate-400">No B2B invoices this month</p>
                  ) : (
                    <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                      {data.b2b.map((party: any) => (
                        <div
                          key={party.gstin}
                          className="flex items-center justify-between rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-pink-50 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {party.legalName || 'GST Customer'}
                            </p>
                            <p className="mt-0.5 font-mono text-[11px] text-slate-400">{party.gstin}</p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-bold text-rose-700">
                              {formatCurrency(party.taxableValue || 0)}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {(party.invoices || []).length} invoice(s)
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">B2C (Individual Guests)</h3>
                    <p className="mt-0.5 text-xs text-slate-400">Non-GST guest invoices</p>
                  </div>
                  <span className="rounded-full bg-pink-100 px-2.5 py-1 text-xs font-medium text-pink-700">
                    {data.b2c_invoiceCount || 0} invoices
                  </span>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {[
                      {
                        label: 'Taxable Value',
                        value: formatCurrency(data.b2c_small?.taxableValue || 0),
                        accent: 'text-slate-900',
                      },
                      {
                        label: 'CGST',
                        value: formatCurrency(data.b2c_small?.cgst || 0),
                        accent: 'text-orange-700',
                      },
                      {
                        label: 'SGST',
                        value: formatCurrency(data.b2c_small?.sgst || 0),
                        accent: 'text-pink-700',
                      },
                    ].map((r) => (
                      <div
                        key={r.label}
                        className="flex items-center justify-between rounded-2xl border border-rose-100 bg-rose-50/50 px-4 py-3"
                      >
                        <span className="text-sm text-slate-500">{r.label}</span>
                        <span className={`text-sm font-bold ${r.accent}`}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div>
                  <h3 className="font-semibold text-slate-900">HSN/SAC Summary</h3>
                  <p className="mt-0.5 text-xs text-slate-400">Breakdown used for GST return reporting</p>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-pink-50">
                        {['HSN', 'Description', 'Qty', 'Taxable Value', 'CGST', 'SGST', 'Total Tax'].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {(data.hsn_summary || []).length ? (
                        data.hsn_summary.map((h: any) => (
                          <tr
                            key={h.hsn}
                            className="border-b border-orange-50 transition hover:bg-gradient-to-r hover:from-orange-50/60 hover:to-pink-50/60"
                          >
                            <td className="px-4 py-3 font-mono font-semibold text-rose-700">{h.hsn}</td>
                            <td className="px-4 py-3 text-slate-700">{h.description}</td>
                            <td className="px-4 py-3 text-slate-600">{h.qty}</td>
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {formatCurrency(h.taxableValue || 0)}
                            </td>
                            <td className="px-4 py-3 font-medium text-orange-700">
                              {formatCurrency(h.cgst || 0)}
                            </td>
                            <td className="px-4 py-3 font-medium text-pink-700">
                              {formatCurrency(h.sgst || 0)}
                            </td>
                            <td className="px-4 py-3 font-bold text-rose-700">
                              {formatCurrency((h.cgst || 0) + (h.sgst || 0))}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                            No HSN summary available for this month
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-14 text-center">
              <p className="font-medium text-slate-500">No GST data available</p>
              <p className="mt-1 text-sm text-slate-400">
                Select a different month or ensure invoices are generated and settled.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}