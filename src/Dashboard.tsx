import React, { useState } from 'react';
import { Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Stack direction="row" spacing={2} mt={4} mb={4}>
      <Button variant="contained" onClick={() => navigate('/user-order-lookup')}>User & Order Lookup</Button>
      <Button variant="contained" onClick={() => navigate('/users')}>Users</Button>
      <Button variant="contained" onClick={() => navigate('/orders')}>Orders</Button>
      <Button variant="contained" onClick={() => navigate('/food')}>Food</Button>
      <Button variant="contained" onClick={() => navigate('/grocery')}>Grocery</Button>
      <Button variant="contained" onClick={() => navigate('/toyboxz')}>Toyboxz</Button>
      <Button variant="contained" onClick={() => navigate('/vegetables-and-fruits')}>Vegetables & Fruits</Button>
      <Button variant="contained" color="secondary" onClick={() => navigate('/delivery-partners')}>Delivery Partners</Button>
    </Stack>
  );
};

export default Dashboard; 