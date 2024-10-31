import {useEffect} from "react";

const ApproveNotice = ({fromUser, toUser}) => {
    console.log("called")

    const handleClose = () => {
        const noticeModal: any = document.querySelector("#notice")
        if (noticeModal)
            noticeModal.close();
    }
    return (
        <dialog id="notice">
            <div>{fromUser} đã thành công match {toUser}</div>

            <button onClick={() => handleClose()}>Close form</button>
        </dialog>
    )
}

export default ApproveNotice;