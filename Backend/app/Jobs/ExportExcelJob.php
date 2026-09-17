<?php

namespace App\Jobs;

use App\Events\ExcelExportReady;
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

    protected $userId;
    protected $conn;
    protected $statement;
    protected $columns;
    protected $title;
    protected $fileName;

    public function __construct($userId, $conn, $statement, $columns, $title, $fileName)
    {
        $this->userId = $userId;
        $this->conn = $conn;
        $this->statement = $statement;
        $this->columns = $columns;
        $this->title = $title;
        $this->fileName = $fileName;
    }

    public function handle()
    {
        try {
            // 1. Fetch query results
            $results = DB::connection($this->conn)->select($this->statement);

            if (empty($results)) {
                event(new ExcelExportReady($this->userId, false, 'No data returned for export.', '', ''));
                return;
            }

            // 2. Group column metadata by metaHeader (Card Section)
            $metaGroups = [];
            foreach ($this->columns as $col) {
                $meta = $col['metaHeader'] ?? 'GENERAL INFORMATION';
                $metaGroups[$meta][] = $col;
            }

            // 3. Construct Excel HTML markup
            $html = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /></head><body>';
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
                $subMeta = $cols[0]['subMetaHeader'] ?? 'Details';
                $html .= '<th colspan="' . count($cols) . '" style="padding: 4px;">' . htmlspecialchars($subMeta) . '</th>';
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
                true,
                'File compiled successfully.',
                $this->fileName,
                $downloadUrl,
            ));

        } catch (Exception $e) {
            event(new ExcelExportReady($this->userId, false, 'Export job failed: ' . $e->getMessage(), '', ''));
        }
    }
}