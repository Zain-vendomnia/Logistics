export const assignTourToDriver = async (driverId: number, tourId: number) => {
    const payload = { driverId, tourId };
    try {
      const response = await fetch('/api/admin/assign-tour', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      const data = await response.json();
      if (response.ok) {
        alert(`Tour ${tourId} assigned to driver ${driverId}`);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while assigning the tour.');
    }

    
  };
  