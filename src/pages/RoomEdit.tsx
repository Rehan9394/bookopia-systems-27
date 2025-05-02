import React from 'react';
import { useParams } from 'react-router-dom';
import { AddEditRoomForm } from '@/components/rooms/AddEditRoomForm';

const RoomEdit = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <>
      {id && <AddEditRoomForm mode="edit" roomId={id} />}
      {!id && <div>No room ID provided</div>}
    </>
  );
};

export default RoomEdit;
