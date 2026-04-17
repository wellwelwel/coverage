export const formatDatetime = (): string => {
  const currentDate = new Date();
  const pad = (datePart: number): string =>
    datePart.toString().padStart(2, '0');

  return (
    `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-${pad(currentDate.getDate())}` +
    ` ${pad(currentDate.getHours())}:${pad(currentDate.getMinutes())}:${pad(currentDate.getSeconds())}`
  );
};
