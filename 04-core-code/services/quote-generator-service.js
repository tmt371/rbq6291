// File: 04-core-code/services/quote-generator-service.js

import { paths } from '../config/paths.js';
/**
 * @fileoverview A new, single-responsibility service for generating the final quote HTML.
 * It pre-fetches and caches templates for better performance.
 */
export class QuoteGeneratorService {
    constructor({ calculationService }) {
        this.calculationService = calculationService;
        this.quoteTemplate = '';
        this.detailsTemplate = '';
        this.gmailTemplate = ''; // [NEW]

        // [MODIFIED] The script now includes a robust CSS inlining mechanism.
        this.actionBarHtml = `
    <div id="action-bar">
        <button id="copy-html-btn">Copy HTML</button>
        <button id="print-btn">Print / Save PDF</button>
    </div>`;

        this.scriptHtml = `
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const copyBtn = document.getElementById('copy-html-btn');
            const printBtn = document.getElementById('print-btn');
            const actionBar = document.getElementById('action-bar');

            if (printBtn) {
                printBtn.addEventListener('click', function() {
                    window.print();
                });
            }

            // [NEW] CSS Inliner function
            const getInlinedHtml = () => {
                // 1. Create a deep clone of the document to avoid modifying the live page
                const clone = document.documentElement.cloneNode(true);

                // 2. Iterate through all stylesheets in the current document
                Array.from(document.styleSheets).forEach(sheet => {
                    try {
                        // 3. For each rule in the stylesheet, find matching elements in the CLONE
                        Array.from(sheet.cssRules).forEach(rule => {
                            const selector = rule.selectorText;
                            if (!selector) return;

                            const elements = clone.querySelectorAll(selector);
                            elements.forEach(el => {
                                // 4. Prepend the rule's styles to the element's existing inline style
                                // This ensures that more specific inline styles (if any) are not overridden.
                                const existingStyle = el.getAttribute('style') || '';
                                el.setAttribute('style', rule.style.cssText + existingStyle);
                            });
                        });
                    } catch (e) {
                        // Ignore potential cross-origin security errors when accessing stylesheets
                        console.warn('Could not process a stylesheet, possibly due to CORS policy:', e.message);
                    }
                });

                // 5. Remove elements that should not be in the copied output
                clone.querySelector('#action-bar')?.remove();
                clone.querySelector('script')?.remove();

                // 6. Return the full, inlined HTML as a string
                return '<!DOCTYPE html>' + clone.outerHTML;
            };

            if (copyBtn) {
                copyBtn.addEventListener('click', function() {
                    // Temporarily change button text to give user feedback
                    copyBtn.textContent = 'Processing...';
                    copyBtn.disabled = true;

                    // Use a timeout to allow the UI to update before the heavy work
                    setTimeout(() => {
                        try {
                            const inlinedHtml = getInlinedHtml();
                           
                            navigator.clipboard.writeText(inlinedHtml)
                                .then(() => {
                                    alert('HTML with inlined styles copied to clipboard successfully!');
                                })
                                .catch(err => {
                                    console.error('Failed to copy with navigator.clipboard:', err);
                                    alert('Failed to copy. Please check console for errors.');
                                });
                        } catch (err) {
                            console.error('Error during CSS inlining process:', err);
                            alert('An error occurred while preparing the HTML. See console for details.');
                        } finally {
                            // Restore button state
                            copyBtn.textContent = 'Copy HTML';
                            copyBtn.disabled = false;
                        }
                    }, 50); // 50ms delay
                });
            }
        });
    <\/script>`;

        // [NEW] Script for GTH (Gmail Template HTML)
        this.scriptHtmlGmail = `
    <div id="action-bar" style="position: fixed; top: 10px; right: 10px; z-index: 9999; display: flex; gap: 10px;">
        <button id="copy-2g-btn" style="padding: 10px 15px; font-size: 16px; font-weight: bold; color: white; background-color: #007bff; border: none; border-radius: 5px; cursor: pointer;">Copy2G</button>
    </div>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const copyBtn = document.getElementById('copy-2g-btn');

            const getInlinedHtmlForGmail = () => {
                const clone = document.documentElement.cloneNode(true);
   
                // --- Ã¤Â¿Â®Ã¦Â­Â£Ã¦Â¨?¢Ã?Ã¨Â¤?¡Ã¨Â?? Ã©? (Phase 3, Step A) ---
                clone.querySelector('title')?.remove();
                
                // Ã§Â§Â»Ã©?¢Â?<style> Ã¦Â¨?¢Ã§Â±Â?(GTH Ã¦Â¨Â¡Ã¦ Â¿Ã¦Â¨??Ã¥Â·Â²Ã¥?¦Â??
                clone.querySelectorAll('style').forEach(s => s.remove());
                
                // Ã§Â§Â»Ã©?¢Â? Ã¤???°Ã???Ã¨?¦Â??
                clone.querySelector('#action-bar')?.remove();
                clone.querySelectorAll('script').forEach(s => s.remove());

                // Ã¨Â¿? Ã? HTML ??Ã§Â´? Ã???
                return {
                    html: '<!DOCTYPE html>' + clone.outerHTML,
                    text: clone.innerText || clone.textContent
                };
            };

            if (copyBtn) {
                copyBtn.addEventListener('click', function() {
                    copyBtn.textContent = 'Processing...';
                    copyBtn.disabled = true;

                    setTimeout(() => {
                        try {
                            const { html, text } = getInlinedHtmlForGmail();

                         
                            // --- Ã¤Â¿Â®Ã¦Â­Â£??¹Ã?Ã¨Â²Â¼Ã¤?? Ã©? (Phase 3, Step A) ---
                            // Ã¥Â¿?¦Ã???Ã¦?Ã¥Â»ÂºÃ§? text/html ??text/plain ?Â©Ã§Â¨Â® Blob
                            navigator.clipboard.write([
                                new ClipboardItem({
                                    'text/html': new Blob([html], { type: 'text/html' }),
                                    'text/plain': new Blob([text], { type: 'text/plain' })
                                })
                            ]).then(() => {
                                alert('Quote copied to clipboard (Rich Text)!');
                             }).catch(err => {
                                console.error('Failed to copy rich text:', err);
                                // Fallback to text copy if rich text fails
                                navigator.clipboard.writeText(text).then(() => {
                                    alert('Rich text copy failed. Copied as plain text.');
                                }).catch(err2 => {
                                    console.error('Fallback text copy failed:', err2);
                                    alert('Failed to copy. Please check console.');
                                });
                            });

                        } catch (err) {
                            console.error('Error during HTML preparation for Gmail:', err);
                            alert('An error occurred. See console.');
                        } finally {
                            copyBtn.textContent = 'Copy2G';
                            copyBtn.disabled = false;
                        }
                    }, 50);
                });
            }
        });
    <\/script>`;


        this._initialize();
        console.log("QuoteGeneratorService Initialized.");
    }

    async _initialize() {
        try {
            // [MODIFIED] (Phase 3, Step B) Load all three templates
            [this.quoteTemplate, this.detailsTemplate, this.gmailTemplate] = await Promise.all([
                fetch(paths.partials.quoteTemplate).then(res => res.text()),
                fetch(paths.partials.detailedItemList).then(res => res.text()),
                fetch(paths.partials.gmailSimple).then(res => res.text()), // [NEW]
            ]);
            console.log("QuoteGeneratorService: All (3) HTML templates pre-fetched and cached.");
        } catch (error) {
            console.error("QuoteGeneratorService: Failed to pre-fetch HTML templates:", error);
            // In a real-world scenario, you might want to publish an error event here.
        }
    }

    /**
     * [NEW] (Phase 3, Step C) Generates the simple HTML for Gmail.
     */
    generateGmailQuoteHtml(quoteData, ui, f3Data) {
        if (!this.gmailTemplate) {
            console.error("QuoteGeneratorService: Gmail template is not loaded yet.");
            return null;
        }

        // 1. Get common data
        // [MODIFIED v6291] 問題 5: getQuoteTemplateData 現在會返回 ourOffer
        const templateData = this.calculationService.getQuoteTemplateData(quoteData, ui, f3Data);

        // 2. [NEW v6290 Task 2] Conditionally create the GST row HTML
        let gstRowHtml = '';
        if (!templateData.uiState.f2.gstExcluded) {
            gstRowHtml = `
                <tr>
                    <td class="summary-label"
                         style="padding: 8px 0; border: 1px solid #dddddd; font-size: 13.3px; text-align: right; padding-right: 20px; color: #555555;">
                        GST</td>
                    <td class="summary-value"
                         style="padding: 8px 0; border: 1px solid #dddddd; font-size: 13.3px; text-align: right; font-weight: 500; padding-right: 10px;">
                        ${templateData.gst}</td>
                </tr>
            `; // [FIX v6291] 移除了錯誤的反斜線 `\`
        }

        // 3. Populate the GTH template
        let finalHtml = this._populateTemplate(this.gmailTemplate, {
            ...templateData,
            // [MODIFIED] v6290 Bind to correct F2 values
            total: templateData.grandTotal,
            deposit: templateData.deposit,
            balance: templateData.balance,
            ourOffer: templateData.ourOffer, // [FIX v6291] 問題 5: 確保 ourOffer 被傳遞

            // Ensure customer info is formatted
            customerInfoHtml: this._formatCustomerInfo(templateData),
            // [MODIFIED v6290 Task 1] Ensure item list is formatted
            itemsTableBody: this._generatePageOneItemsTableHtml_GTH(templateData),
            // [NEW v6290 Task 2] Pass the conditional GST row
            gstRowHtml: gstRowHtml
        });

        // 4. [REMOVED v6290 Task 2] Remove the faulty regex replacement
        // const gstRowRegex = /<tr[^>]*>[\s\S]*?<td[^>]*>[\s\S]*?GST[\s\S]*?<\/td>[\s\S]*?<\/tr>/i;
        // finalHtml = finalHtml.replace(gstRowRegex, '');


        // 5. Inject the GTH script
        finalHtml = finalHtml.replace(
            '</body>',
            `${this.scriptHtmlGmail}</body>`
        );

        return finalHtml;
    }

    /**
     * Generates the full HTML for PDF/Print.
     */
    generateQuoteHtml(quoteData, ui, f3Data) {
        if (!this.quoteTemplate || !this.detailsTemplate) {
            console.error("QuoteGeneratorService: Templates are not loaded yet.");
            return null;
        }

        // 1. Delegate all data preparation to CalculationService.
        // [MODIFIED v6291] 問題 5: getQuoteTemplateData 現在會返回 ourOffer
        const templateData = this.calculationService.getQuoteTemplateData(quoteData, ui, f3Data);

        // 2. [NEW v6290 Task 2] Conditionally create the GST row HTML for the *Original Table*
        let gstRowHtml = '';
        if (!templateData.uiState.f2.gstExcluded) {
            gstRowHtml = `
                <tr> 
                    <td class="summary-label">GST (10%)</td> 
                    <td class="summary-value">${templateData.gst}</td>
                </tr>
            `;
        }

        // 3. Generate HTML snippets using the prepared data.
        const populatedDataWithHtml = {
            ...templateData,
            customerInfoHtml: this._formatCustomerInfo(templateData),
            // [MODIFIED v6290 Task 1] Use the single-table generator
            // [FIX v6291] (問題 1, 2) 此函式現在只返回 <tr>...</tr>
            itemsTableBody: this._generatePageOneItemsTableHtml_Original(templateData),
            rollerBlindsTable: this._generateItemsTableHtml(templateData),
            gstRowHtml: gstRowHtml // [NEW] Pass the conditional GST row
        };

        // 4. Populate templates
        const populatedDetailsPageHtml = this._populateTemplate(this.detailsTemplate, populatedDataWithHtml);

        const styleMatch = populatedDetailsPageHtml.match(/<style>([\s\S]*)<\/style>/i);
        const detailsBodyMatch = populatedDetailsPageHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);

        if (!detailsBodyMatch) {
            throw new Error("Could not find body content in the details template.");
        }

        const detailsStyleContent = styleMatch ? styleMatch[0] : '';
        const detailsBodyContent = detailsBodyMatch[1];

        let finalHtml = this.quoteTemplate.replace('</head>', `${detailsStyleContent}</head>`);
        finalHtml = finalHtml.replace('</body>', `${detailsBodyContent}</body>`);
        finalHtml = this._populateTemplate(finalHtml, populatedDataWithHtml);

        // 5. Inject the action bar and script into the final HTML
        finalHtml = finalHtml.replace(
            '<body>',
            `<body>${this.actionBarHtml}`
        );

        finalHtml = finalHtml.replace(
            '</body>',
            `${this.scriptHtml}</body>`
        );

        return finalHtml;
    }

    _populateTemplate(template, data) {
        return template.replace(/\{\{\{?([\w\-]+)\}\}\}?/g, (match, key) => {
            // [MODIFIED] Handle GTH template keys which are different
            const value = data.hasOwnProperty(key) ? data[key] : null;

            // Allow `null` or `0` to be rendered
            if (value !== null && value !== undefined) {
                return value;
            }

            // Fallback for GTH keys that might not be in templateData root
            if (key === 'total') return data.grandTotal;
            if (key === 'deposit') return data.deposit;
            if (key === 'balance') return data.balance;
            // [NEW v6291] 問題 5: 增加 ourOffer 的 fallback
            if (key === 'ourOffer') return data.ourOffer;

            return match; // Keep original placeholder if key not found
        });
    }

    _formatCustomerInfo(templateData) {
        let html = `<strong>${templateData.customerName || ''}</strong><br>`;
        if (templateData.customerAddress) html += `${templateData.customerAddress.replace(/\n/g, '<br>')}<br>`;
        if (templateData.customerPhone) html += `Phone: ${templateData.customerPhone}<br>`;
        if (templateData.customerEmail) html += `Email: ${templateData.customerEmail}`;
        return html;
    }

    _generateItemsTableHtml(templateData) {
        const { items, mulTimes } = templateData;
        const headers = ['#', 'F-NAME', 'F-COLOR', 'Location', 'HD', 'Dual', 'Motor', 'Price'];

        const rows = items
            .filter(item => item.width && item.height)
            .map((item, index) => {


                let fabricClass = '';
                if (item.fabric && item.fabric.toLowerCase().includes('light-filter')) {
                    fabricClass = 'bg-light-filter';
                } else if (item.fabricType === 'SN') {
                    fabricClass = 'bg-screen';
                } else if (['B1', 'B2', 'B3', 'B4', 'B5'].includes(item.fabricType)) {
                    fabricClass = 'bg-blockout';
                }

                const finalPrice = (item.linePrice || 0) * mulTimes;


                const cell = (dataLabel, content, cssClass = '') => {
                    const isEmpty = !content;
                    const finalClass = `${cssClass} ${isEmpty ? 'is-empty-cell' : ''}`.trim();
                    return `<td data-label="${dataLabel}" class="${finalClass}">${content}</td>`;
                };

                const cells = [
                    cell('#', index + 1, 'text-center'),
                    cell('F-NAME', item.fabric || '', fabricClass),
                    cell('F-COLOR', item.color || '', fabricClass),
                    cell('Location', item.location || ''),
                    // [FIX v6291] (手機 PDF 問題 2) 修正亂碼 "?? " 為 "Y"
                    cell('HD', item.winder === 'HD' ? 'Y' : '', 'text-center'),
                    cell('Dual', item.dual === 'D' ? 'Y' : '', 'text-center'),
                    cell('Motor', item.motor ? 'Y' : '', 'text-center'),
                    cell('Price', `$${finalPrice.toFixed(2)}`, 'text-right')
                ].join('');

                return `<tr>${cells}</tr>`;
            })
            .join('');

        return `
            <table class="detailed-list-table">
                <colgroup>
                    <col style="width: 5%;">   <col style="width: 20%;"> <col style="width: 15%;"> <col style="width: 14.65%;"> <col style="width: 8.1%;">  <col style="width: 8.1%;">  <col style="width: 8.1%;">  <col style="width: 10.4%;"> </colgroup>
                <thead>
                    <tr class="table-title">
                        <th colspan="${headers.length}">Roller Blinds - Detailed List</th>
                    </tr>
                    <tr>
                        ${headers.map(h => `<th>${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    // [NEW v6290 Task 1] This is the new function for "Original" (Add Quote)
    // It generates a SINGLE table
    _generatePageOneItemsTableHtml_Original(templateData) {
        const { summaryData, uiState, items } = templateData;
        const rows = [];
        const validItemCount = items.filter(i => i.width && i.height).length;

        const createRow = (number, description, qty, price, discountedPrice, isExcluded = false) => {
            // [FIX v6291] 問題 3: 如果 Price 被排除，Discounted Price 應為 0
            const discountedPriceValue = isExcluded ? 0 : discountedPrice;
            const isDiscounted = discountedPriceValue < price;

            // [FIX v6291] (手機 PDF 問題 1.2, 1.3, 1.4) 實作新的顏色/樣式邏輯
            let priceStyle = 'style="color: #333;"'; // (1.3) 預設 Price 為黑色
            // (1.3) 預設 Discounted Price 為黑色 (CSS 會使其變紅，這裡的 style 用於覆蓋)
            let discountedPriceStyle = 'style="color: #333;"';

            if (isExcluded) {
                // (1.4) Price: 灰色刪除線, Discounted: 紅色 (金額為 0)
                priceStyle = 'style="text-decoration: line-through; color: #999999;"';
                discountedPriceStyle = 'style="color: #d32f2f;"';
            } else if (isDiscounted) {
                // (1.2) Price: 灰色, Discounted: 紅色
                priceStyle = 'style="color: #999999;"';
                discountedPriceStyle = 'style="color: #d32f2f;"'; // 保持紅色 (CSS 預設)
            }
            // (1.3) 的情況 (isExcluded = false 且 isDiscounted = false) 已在預設值中處理 (兩者皆為黑色)

            return `
                <tr>
                    <td data-label="NO">${number}</td>
                    <td data-label="Description" class="description">${description}</td>
                    <td data-label="QTY" class="align-right">${qty}</td>
                    <td data-label="Price" class="align-right">
                        <span class="original-price" ${priceStyle}>$${price.toFixed(2)}</span>
                    </td>
                    <td data-label="Discounted Price" class="align-right">
                        <span class="discounted-price" ${discountedPriceStyle}>$${discountedPriceValue.toFixed(2)}</span>
                    </td>
                </tr>
            `;
        };

        let itemNumber = 1;

        // Row 1: Roller Blinds
        rows.push(createRow(
            itemNumber++,
            'Roller Blinds',
            validItemCount,
            summaryData.firstRbPrice || 0,
            summaryData.disRbPrice || 0,
            false // 確保 Roller Blinds Price 欄位沒有刪除線 (除非有折扣)
        ));

        // Row 2: Installation Accessories (Optional)
        // [FIX v6291] 問題 1: 修正 isExcluded 參數，確保 Price 欄位沒有刪除線
        if (summaryData.acceSum > 0) {
            rows.push(createRow(
                itemNumber++,
                'Installation Accessories',
                'NA',
                summaryData.acceSum || 0,
                summaryData.acceSum || 0,
                false // 確保此項目 Price 欄位沒有刪除線
            ));
        }

        // Row 3: Motorised Package (Optional)
        // [MODIFIED v6291] 問題 2 & 5: 改名
        // [FIX v6291] 問題 2: 修正 isExcluded 參數，確保 Price 欄位沒有刪除線
        if (summaryData.eAcceSum > 0) {
            rows.push(createRow(
                itemNumber++,
                'Motorised Package',
                'NA',
                summaryData.eAcceSum || 0,
                summaryData.eAcceSum || 0,
                false // 確保此項目 Price 欄位沒有刪除線
            ));
        }

        // Row 4: Delivery
        // [註] 問題 6: 此處邏輯已正確。isExcluded 會傳入 deliveryExcluded
        const deliveryExcluded = uiState.f2.deliveryFeeExcluded;
        rows.push(createRow(
            itemNumber++,
            'Delivery',
            uiState.f2.deliveryQty || 1,
            summaryData.deliveryFee || 0,
            summaryData.deliveryFee || 0,
            deliveryExcluded
        ));

        // Row 5: Installation
        // [註] 問題 7: 此處邏輯已正確。isExcluded 會傳入 installExcluded
        const installExcluded = uiState.f2.installFeeExcluded;
        rows.push(createRow(
            itemNumber++,
            'Installation',
            uiState.f2.installQty || 0, // Use installQty from F2 state
            summaryData.installFee || 0,
            summaryData.installFee || 0,
            installExcluded
        ));

        // Row 6: Removal
        // [註] 問題 8: 此處邏輯已正確。isExcluded 會傳入 removalExcluded
        const removalExcluded = uiState.f2.removalFeeExcluded;
        rows.push(createRow(
            itemNumber++,
            'Removal',
            uiState.f2.removalQty || 0,
            summaryData.removalFee || 0,
            summaryData.removalFee || 0,
            removalExcluded
        ));

        // [FIX v6291] 問題 1, 2: 移除 <table>...</table> 包裹，只返回 <tr>
        return rows.join('');
    }

    // [NEW v6290 Task 1] This is the restored function for GTH
    // It generates MULTIPLE tables (cards)
    _generatePageOneItemsTableHtml_GTH(templateData) {
        const { summaryData, uiState, items } = templateData;
        const rows = [];
        const validItemCount = items.filter(i => i.width && i.height).length;

        // [MODIFIED v6290] Use new helper function to build rows
        const createRow = (number, description, qty, price, discountedPrice, isExcluded = false) => {
            // [FIX v6291] 問題 3: 如果 Price 被排除，Discounted Price 應為 0
            const discountedPriceValue = isExcluded ? 0 : discountedPrice;
            const isDiscounted = discountedPriceValue < price;

            // [FIX v6291] (手機 PDF 問題 1.2, 1.3, 1.4) 實作新的顏色/樣式邏輯 (GTH 版本)
            let priceStyle = 'style="color: #333;"'; // (1.3) 預設 Price 為黑色
            let discountedPriceStyle = 'style="font-weight: bold; color: #333;"'; // (1.3) GTH 預設黑色粗體

            if (isExcluded) {
                // (1.4) Price: 灰色刪除線, Discounted: 紅色
                priceStyle = 'style="text-decoration: line-through; color: #999999;"';
                discountedPriceStyle = 'style="font-weight: bold; color: #d32f2f;"';
            } else if (isDiscounted) {
                // (1.2) Price: 灰色, Discounted: 紅色
                priceStyle = 'style="color: #999999;"';
                discountedPriceStyle = 'style="font-weight: bold; color: #d32f2f;"';
            }
            // (1.3) 情況 (isExcluded = false 且 isDiscounted = false) 已在預設值中處理


            return `
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
                    style="border-collapse: collapse; margin-bottom: 15px; border: 1px solid #e0e0e0; border-radius: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                    <tbody>
                        <tr>
                            <td
                                style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0; background-color: #1a237e; color: white; border-radius: 4px 4px 0 0;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="color: white;">
                                    <tr>
                                        <td width="50%" valign="top" style="text-align: left; font-weight: bold;">#${number}</td>
                                        <td width="50%" valign="top" style="text-align: right; font-weight: normal;">${description}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td width="50%" valign="top" style="text-align: left; font-weight: 600;">QTY</td>
                                        <td width="50%" valign="top" style="text-align: right;">${qty}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td width="50%" valign="top" style="text-align: left; font-weight: 600;">Price</td>
                                        <td width="50%" valign="top" style="text-align: right;">
                                            <span ${priceStyle}>$${price.toFixed(2)}</span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 15px;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td width="50%" valign="top" style="text-align: left; font-weight: 600;">Discounted Price</td>
                                        <td width="50%" valign="top" style="text-align: right;">
                                            <span ${discountedPriceStyle}>$${discountedPriceValue.toFixed(2)}</span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;
        };

        let itemNumber = 1;

        // Row 1: Roller Blinds
        rows.push(createRow(
            itemNumber++,
            'Roller Blinds',
            validItemCount,
            summaryData.firstRbPrice || 0,
            summaryData.disRbPrice || 0,
            false // 確保 Roller Blinds Price 欄位沒有刪除線 (除非有折扣)
        ));

        // Row 2: Installation Accessories (Optional)
        // [FIX v6291] 問題 1: 修正 isExcluded 參數，確保 Price 欄位沒有刪除線
        if (summaryData.acceSum > 0) {
            rows.push(createRow(
                itemNumber++,
                'Installation Accessories',
                'NA',
                summaryData.acceSum || 0,
                summaryData.acceSum || 0,
                false // 確保此項目 Price 欄位沒有刪除線
            ));
        }

        // Row 3: Motorised Accessories (Optional)
        // [FIX v6291] 問題 2: 修正 isExcluded 參數，確保 Price 欄位沒有刪除線
        // [MODIFIED v6291] 問題 2: 改名
        if (summaryData.eAcceSum > 0) {
            rows.push(createRow(
                itemNumber++,
                'Motorised Package',
                'NA',
                summaryData.eAcceSum || 0,
                summaryData.eAcceSum || 0,
                false // 確保此項目 Price 欄位沒有刪除線
            ));
        }

        // Row 4: Delivery
        const deliveryExcluded = uiState.f2.deliveryFeeExcluded;
        rows.push(createRow(
            itemNumber++,
            'Delivery',
            uiState.f2.deliveryQty || 1,
            summaryData.deliveryFee || 0,
            summaryData.deliveryFee || 0,
            deliveryExcluded
        ));

        // Row 5: Installation
        // [MODIFIED v6290 Bug 1 Fix]
        const installExcluded = uiState.f2.installFeeExcluded;
        rows.push(createRow(
            itemNumber++,
            'Installation',
            uiState.f2.installQty || 0, // Use installQty from F2 state
            summaryData.installFee || 0,
            summaryData.installFee || 0,
            installExcluded
        ));

        // Row 6: Removal
        const removalExcluded = uiState.f2.removalFeeExcluded;
        rows.push(createRow(
            itemNumber++,
            'Removal',
            uiState.f2.removalQty || 0,
            summaryData.removalFee || 0,
            summaryData.removalFee || 0,
            removalExcluded
        ));

        return rows.join('');
    }
}