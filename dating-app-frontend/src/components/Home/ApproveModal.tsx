const ApproveModal = ({socket, fromUser, targetUser}: any) => {
    const handleCloseModal = () => {
        const modal = document.querySelector("dialog");
        if (modal)
            modal.close();
    }
    const handleMatch = (status: string) => {
        console.log("status: " + status);
        socket.emit("sendLike", {currentUserId: targetUser, targetUserId: fromUser, approveStatus: status});

        const modal = document.querySelector("dialog");
        if (modal)
            modal.close();
    }
    return (
        <>
            <dialog id='approveBox'>
                <h1>Target: ${targetUser}</h1>
                <div className="flex flex-row gap-x-2">
                    <button onClick={() => handleCloseModal()}>Close modal</button>
                    <button onClick={() => handleMatch("success")}>Accept</button>
                    <button onClick={() => handleMatch("decline")}>Decline</button>
                </div>


            </dialog>
        </>
    )
}

export default ApproveModal;