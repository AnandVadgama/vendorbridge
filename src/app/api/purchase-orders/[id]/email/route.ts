import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { Role } from '@prisma/client';

/**
 * POST /api/purchase-orders/[id]/email
 * Sends the PO and Invoice PDF/details to the Vendor's email.
 * Allowed: ADMIN, PROCUREMENT_OFFICER, MANAGER
 */
export const POST = auth(async (req, { params }) => {
  if (!req.auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role } = req.auth.user;
  if (role === Role.VENDOR) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const resolvedParams = await (params as any);
  const poId = resolvedParams.id;

  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        vendor: true,
        invoices: true,
        quotation: {
          include: {
            items: {
              include: {
                rfqItem: true,
              },
            },
          },
        },
      },
    });

    if (!po) {
      return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });
    }

    const invoice = po.invoices[0];
    const invoiceDetailsHtml = invoice
      ? `<li><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</li>
         <li><strong>Invoice Status:</strong> ${invoice.status}</li>
         <li><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</li>`
      : '<li><strong>Invoice Status:</strong> Not Generated</li>';

    const itemsListHtml = po.quotation.items
      .map(
        (item) =>
          `<tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${item.rfqItem.productName}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${item.unitPrice.toLocaleString()}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${item.totalPrice.toLocaleString()}</td>
          </tr>`
      )
      .join('');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #2563eb; margin-top: 0;">Purchase Order Issued: ${po.poNumber}</h2>
        <p>Dear <strong>${po.vendor.companyName}</strong>,</p>
        <p>We are pleased to issue the following Purchase Order to your company. Please find the details below:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Item</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Unit Price</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Total Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsListHtml}
          </tbody>
        </table>

        <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151; font-size: 16px;">Billing Details:</h3>
          <ul style="padding-left: 20px; margin: 0; color: #4b5563; line-height: 1.6;">
            <li><strong>Grand Total:</strong> ₹${po.grandTotal.toLocaleString()}</li>
            ${invoiceDetailsHtml}
          </ul>
        </div>

        <p>If you have any questions, please contact the procurement office.</p>
        <p style="margin-bottom: 0;">Best regards,<br><strong>VendorBridge Team</strong></p>
      </div>
    `;

    const emailResult = await sendEmail({
      to: po.vendor.email,
      subject: `[VendorBridge] Purchase Order Issued: ${po.poNumber}`,
      html: emailHtml,
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error || 'SMTP failed to send mail');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ POST /api/purchase-orders/[id]/email error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to email Purchase Order' },
      { status: 500 }
    );
  }
});
