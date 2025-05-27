import React from 'react';
import './SkeletonLoader.css'; // Import the CSS

function SkeletonLoader({ count = 1, type = 'generic', className = '' }) {
    const renderGenericSkeleton = (key) => (
        <div key={key} className="skeleton-item">
            <div className="skeleton-line title"></div>
            <div className="skeleton-line text"></div>
            <div className="skeleton-line text short"></div>
        </div>
    );

    const renderServiceCardSkeleton = (key) => (
        // Mimics structure of .service-card in BookingPage (if that's the target)
        // or the service items in ServicesSection
        <div key={key} className="skeleton-item skeleton-service-card">
            <div className="skeleton-line title" style={{ width: '60%', height: '22px', marginBottom: '0.6rem' }}></div>
            <div className="skeleton-line text" style={{ marginBottom: '0.4rem' }}></div>
            <div className="skeleton-line text" style={{ width: '80%', marginBottom: '0.8rem' }}></div>
            <div className="skeleton-line text short" style={{ height: '18px', width: '40%' }}></div>
        </div>
    );

    const renderServiceItemSkeleton = (key) => (
        // Mimics structure of .service-item in ServicesSection.js
        <div key={key} className="skeleton-item skeleton-service-item">
            <div className="skeleton-service-item-info">
                <div className="skeleton-line title" style={{ width: '70%', height: '20px', marginBottom: '0.5rem' }}></div>
                <div className="skeleton-line text" style={{ width: '90%' }}></div>
            </div>
            <div className="skeleton-service-item-action">
                <div className="skeleton-line" style={{ width: '50px', height: '18px', marginBottom: '0.5rem' }}></div>
                <div className="skeleton-button-placeholder"></div>
            </div>
        </div>
    );


    const renderAppointmentItemSkeleton = (key) => (
        // Mimics structure of an appointment list item (e.g., from AppointmentList.js)
        // This needs to be adjusted based on whether it's a table row or card view.
        // For now, a generic card-like structure:
        <div key={key} className="skeleton-item skeleton-appointment-item">
            <div className="skeleton-line title" style={{ width: '75%', height: '20px' }}></div>
            <div className="skeleton-line text" style={{ width: '50%' }}></div>
            <div className="skeleton-line text short" style={{ width: '30%' }}></div>
        </div>
    );
    
    const renderTableRowSkeleton = (key, columns = 3) => (
      <tr key={key} className="skeleton-table-row">
          {Array.from({ length: columns }).map((_, index) => (
              <td key={index} style={{ padding: '0.5rem 0.7rem', borderBottom: '1px solid #e0e0e0' }}>
                  <div className="skeleton-cell-content"></div>
              </td>
          ))}
      </tr>
    );


    const items = [];
    for (let i = 0; i < count; i++) {
        switch (type) {
            case 'service-card': // For grid view of services like in BookingPage
                items.push(renderServiceCardSkeleton(i));
                break;
            case 'service-item': // For list view of services like in ServicesSection
                items.push(renderServiceItemSkeleton(i));
                break;
            case 'appointment': // For AppointmentList, assuming card view for now
                items.push(renderAppointmentItemSkeleton(i));
                break;
            case 'appointment-row': // For AppointmentList, if it uses a table and we want row skeletons
                 // This would be typically used within a <tbody>
                items.push(renderTableRowSkeleton(i, 4)); // Assuming 4 columns in appointment table
                break;
            case 'service-row': // For ServiceList in admin, if it uses a table
                items.push(renderTableRowSkeleton(i, 5)); // Assuming 5 columns in service table
                break;
            default:
                items.push(renderGenericSkeleton(i));
                break;
        }
    }

    // If type is 'appointment-row' or 'service-row', it implies it's part of a table.
    // The component should then return a tbody or just the rows.
    // For simplicity, if 'row' is in type, we assume it's used within a table.
    if (type.includes('-row')) {
        return <>{items}</>; // These will be <tr> elements
    }

    return (
        <div className={`skeleton-wrapper ${className}`}>
            {items}
        </div>
    );
}

export default SkeletonLoader;
