interface InfoItemProps {
  label: string;
  value: string | number;
  icon?: string;
}

const InfoItem = ({ label, value, icon }: InfoItemProps) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition duration-300">
      <span className="text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        {icon && <i className={`fas ${icon} text-purple-500`}></i>}
        <span className="font-medium text-gray-800">{value}</span>
      </div>
    </div>
  );
};

export default InfoItem; 