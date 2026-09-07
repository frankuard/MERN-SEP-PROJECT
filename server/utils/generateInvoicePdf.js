const PDFDocument = require('pdfkit');

const formatNPR = (n) => `NPR ${Number(n || 0).toLocaleString('en-US')}`;

const generateInvoicePdf = (order) => new Promise((resolve, reject) => {
  try {
    const doc = new PDFDocument({ margin: 48, size: 'A4' });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const buyerName = order.user?.username || order.userName || 'Student';
    const buyerEmail = order.user?.email || '';
    const buyerRole = order.userRole === 'teacher' ? 'Teacher' : 'Student';
    const date = new Date(order.createdAt || Date.now());

    const pageWidth = 595.28;
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;
    const title = 'CHAUTTARI CANTEEN';
    const titleFont = 24;

    doc.fontSize(titleFont).font('Helvetica-Bold')
      .text(title, margin, 40, { width: contentWidth });
    let textWidth = doc.widthOfString(title);
    doc.fontSize(8).font('Helvetica')
      .fillColor('#666666')
      .text('Campus Community Food Service · Official Bill / Invoice', margin, 40 + titleFont + 4, { width: contentWidth });

    doc.moveDown(1.2);
    doc.fontSize(10).font('Helvetica-Bold')
      .fillColor('#111111')
      .text('INVOICE / BILL', margin, doc.y, { continued: false });
    doc.fontSize(9).font('Helvetica')
      .fillColor('#333333')
      .text(`Invoice No: #${order._id.toString().slice(-6).toUpperCase()}`, margin, doc.y + 2);
    doc.text(`Date: ${date.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, { continued: false });
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica-Bold')
      .fillColor('#111111')
      .text('CUSTOMER DETAILS');
    doc.moveDown(0.2);
    doc.fontSize(9).font('Helvetica')
      .fillColor('#333333')
      .text(`Name: ${buyerName}`)
      .text(`Type: ${buyerRole}`)
      .text(`Email: ${buyerEmail || '—'}`)
      .text(`Table No: ${order.tableNumber || '—'}`);

    doc.moveDown(0.8);

    doc.fontSize(10).font('Helvetica-Bold')
      .fillColor('#111111')
      .text('ORDER ITEMS');
    doc.moveDown(0.2);

    const tableTop = doc.y;
    const colX = {
      item: margin,
      qty: margin + contentWidth * 0.62,
      unit: margin + contentWidth * 0.7,
      total: margin + contentWidth * 0.85,
    };
    const colWidths = {
      item: colX.qty - colX.item - 20,
      qty: colX.unit - colX.qty - 14,
      unit: colX.total - colX.unit - 14,
      total: contentWidth - (colX.total - margin),
    };

    doc.fontSize(8.5).font('Helvetica-Bold')
      .fillColor('#111111')
      .text('Item', colX.item, tableTop, { width: colWidths.item })
      .text('Qty', colX.qty, tableTop, { width: colWidths.qty, align: 'right' })
      .text('Unit Price', colX.unit, tableTop, { width: colWidths.unit, align: 'right' })
      .text('Total', colX.total, tableTop, { width: colWidths.total, align: 'right' });

    doc.moveTo(margin, tableTop + 15)
      .lineTo(pageWidth - margin, tableTop + 15)
      .strokeColor('#cccccc')
      .stroke();

    doc.moveDown(0.5);

    const items = order.items || [];
    let lineY = doc.y + 4;

    doc.fontSize(9).font('Helvetica')
      .fillColor('#333333');

    items.forEach((item) => {
      const nameDisplay = item.name.length > 32 ? item.name.slice(0, 29) + '...' : item.name;
      doc.text(nameDisplay, margin, lineY, { width: colWidths.item })
        .text(String(item.quantity), colX.qty, lineY, { width: colWidths.qty, align: 'right' })
        .text(formatNPR(item.price), colX.unit, lineY, { width: colWidths.unit, align: 'right' })
        .text(formatNPR(item.price * item.quantity), colX.total, lineY, { width: colWidths.total, align: 'right' });
      lineY += 17;
    });

    const itemsBottomY = lineY + 8;
    doc.moveTo(margin, itemsBottomY)
      .lineTo(pageWidth - margin, itemsBottomY)
      .strokeColor('#cccccc')
      .stroke();

    const subtotal = order.totalAmount;
    const totalY = itemsBottomY + 13;

    doc.fontSize(9).font('Helvetica')
      .fillColor('#333333')
      .text('Subtotal', colX.item, totalY, { width: colWidths.item });
    doc.fontSize(9).font('Helvetica-Bold')
      .fillColor('#111111')
      .text(formatNPR(subtotal), colX.total, totalY, { width: colWidths.total, align: 'right' });

    const totalRowY = totalY + 18;
    doc.fontSize(11).font('Helvetica-Bold')
      .fillColor('#111111')
      .text('TOTAL', colX.item, totalRowY, { width: colWidths.item });
    doc.fontSize(11).font('Helvetica-Bold')
      .fillColor('#111111')
      .text(formatNPR(subtotal), colX.total, totalRowY, { width: colWidths.total, align: 'right' });

    const statusY = totalRowY + 30;
    doc.fontSize(9).font('Helvetica-Bold')
      .fillColor('#111111')
      .text('PAYMENT STATUS:', margin, statusY, { width: contentWidth });
    doc.moveDown(0.2);
    doc.fontSize(10).font('Helvetica-Bold')
      .fillColor('#15803d')
      .text('PAID ✓', margin, doc.y + 2);

    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica')
      .fillColor('#333333')
      .text(`Payment Method: Pay at Counter`, margin, doc.y + 4)
      .text(`Order Status: ${order.orderStatus || 'Completed'}`, { continued: false });

    doc.moveDown(1.5);
    doc.fontSize(9).font('Helvetica')
      .fillColor('#666666')
      .text('Thank you for your purchase!', margin, doc.y, { width: contentWidth, align: 'center' });
    doc.fontSize(8)
      .fillColor('#999999')
      .text('Chauttari Canteen · Campus Community Platform', margin, doc.y + 14, { width: contentWidth, align: 'center' });

    doc.end();
  } catch (err) {
    reject(err);
  }
});

module.exports = generateInvoicePdf;
