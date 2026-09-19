<?php

namespace App\Jobs;

use App\Events\ExcelExportReady;
use App\Jobs\DeleteExportFileJob;
use App\Jobs\Middleware\DeferIfServerBusy;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Exception;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

class ExportExcelJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 10;

    protected $userId;
    protected $token;
    protected $conn;
    protected $statement;
    protected $columns;
    protected $title;
    protected $fileName;
    protected $requestId;

    public function __construct($userId, $token, $conn, $statement, $columns, $title, $fileName, $requestId = null)
    {
        $this->userId    = $userId;
        $this->token     = $token;
        $this->conn      = $conn;
        $this->statement = $statement;
        $this->columns   = $columns;
        $this->title     = $title;
        $this->fileName  = $fileName;
        $this->requestId = $requestId;
    }

    public function middleware(): array
    {
        // Defer job if CPU > 70%, retry after 180 seconds (3 mins)
        return [new DeferIfServerBusy(70.0, 180)];
    }

    public function handle()
    {
        try {
            // 1. Fetch query results
            $results = DB::connection($this->conn)->select($this->statement);

            if (empty($results)) {
                event(new ExcelExportReady(
                    $this->userId,
                    $this->token,
                    false,
                    'No data returned for export.',
                    '',
                    '',
                    $this->requestId
                ));
                return;
            }

            // 2. Group column metadata by metaHeader (Card Section)
            $metaGroups = [];
            foreach ($this->columns as $col) {
                $meta = $col['metaHeader'] ?? 'GENERAL INFORMATION';
                $metaGroups[$meta][] = $col;
            }

            // 3. Construct Excel HTML markup
            $html  = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /></head><body>';
            $html .= '<table border="1" style="border-collapse:collapse;">';

            // Document Header Row
            $totalCols = count($this->columns);
            $html .= '<tr style="background-color: #1e293b; color: #ffffff; font-weight: bold; font-size: 14px; text-align: center;">';
            $html .= '<th colspan="' . $totalCols . '" style="padding: 10px;">' . htmlspecialchars($this->title) . '</th>';
            $html .= '</tr>';

            // Meta-Header Level Row
            $html .= '<tr style="background-color: #334155; color: #60a5fa; font-weight: bold; text-align: center;">';
            foreach ($metaGroups as $metaTitle => $cols) {
                $html .= '<th colspan="' . count($cols) . '" style="padding: 6px;">' . htmlspecialchars($metaTitle) . '</th>';
            }
            $html .= '</tr>';

            // Sub-Meta Header Level Row
            $html .= '<tr style="background-color: #475569; color: #f1f5f9; text-align: center;">';
            foreach ($metaGroups as $cols) {
                // Group columns under current meta header by subMetaHeader
                $subMetaGroups = [];
                foreach ($cols as $col) {
                    $subMeta = $col['subMetaHeader'] ?? 'Details';
                    $subMetaGroups[$subMeta][] = $col;
                }
                foreach ($subMetaGroups as $subMetaTitle => $subCols) {
                    $html .= '<th colspan="' . count($subCols) . '" style="padding: 4px;">' . htmlspecialchars($subMetaTitle) . '</th>';
                }
            }
            $html .= '</tr>';

            // Column Header Labels Row
            $html .= '<tr style="background-color: #f8fafc; font-weight: bold;">';
            foreach ($this->columns as $col) {
                $html .= '<th style="padding: 5px;">' . htmlspecialchars($col['label'] ?? $col['key']) . '</th>';
            }
            $html .= '</tr>';

            // Data Rows
            foreach ($results as $index => $row) {
                $rowArray = (array) $row;
                $html .= '<tr>';
                foreach ($this->columns as $col) {
                    $key = $col['key'];
                    $val = '—';

                    if ($key === 'serial_no') {
                        $val = $index + 1;
                    } elseif (isset($rowArray[$key])) {
                        $rawVal = $rowArray[$key];
                        $val = is_array($rawVal) || is_object($rawVal) ? json_encode($rawVal) : $rawVal;
                    }

                    $html .= '<td style="padding: 4px;">' . htmlspecialchars($val) . '</td>';
                }
                $html .= '</tr>';
            }

            $html .= '</table></body></html>';

            // 4. Save to Storage
            $filePath = 'exports/' . $this->fileName;
            Storage::disk('local')->put($filePath, $html);

            $downloadUrl = URL::temporarySignedRoute(
                'excel.download',
                now()->addMinutes(30),
                ['fileName' => $this->fileName]
            );

            // 5. Broadcast payload to private user channel
            event(new ExcelExportReady(
                $this->userId,
                $this->token,
                true,
                'File compiled successfully.',
                $this->fileName,
                $downloadUrl,
                $this->requestId
            ));

            // 6. Schedule auto-deletion after 30 minutes
            DeleteExportFileJob::dispatch($filePath)->delay(now()->addMinutes(30));

        } catch (Exception $e) {
            event(new ExcelExportReady(
                $this->userId,
                $this->token,
                false,
                'Export job failed: ' . $e->getMessage(),
                '',
                '',
                $this->requestId
            ));
        }
    }
}