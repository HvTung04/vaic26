export interface KnowledgeNode {
  id: string;
  label: string;
  grade: number;
}

/**
 * Vietnamese math curriculum knowledge-graph nodes (Chương trình GDPT 2018).
 * Source: docs/curriculum_nodes.json
 * Node IDs match the backend taxonomy (L{grade}-t{topic}-B{block}).
 */
export const KNOWLEDGE_NODES: KnowledgeNode[] = [
  // Grade 6
  { id: 'L6-t1-B01', label: 'Số tự nhiên', grade: 6 },
  { id: 'L6-t1-B02', label: 'Phép tính số tự nhiên', grade: 6 },
  { id: 'L6-t1-B03', label: 'Chia hết, số nguyên tố', grade: 6 },
  { id: 'L6-t2-B01', label: 'Số nguyên', grade: 6 },
  { id: 'L6-t2-B02', label: 'Phép tính số nguyên', grade: 6 },
  { id: 'L6-t3-B01', label: 'Phân số', grade: 6 },
  { id: 'L6-t3-B02', label: 'Phép tính phân số', grade: 6 },
  { id: 'L6-t3-B03', label: 'Số thập phân & Tỉ lệ', grade: 6 },
  { id: 'L6-t4-B01', label: 'Hình học trực quan', grade: 6 },
  { id: 'L6-t4-B02', label: 'Đường tròn & hình quạt', grade: 6 },
  { id: 'L6-t5-B01', label: 'Đo lường hình phẳng', grade: 6 },
  { id: 'L6-t5-B02', label: 'Diện tích hình phức tạp', grade: 6 },
  { id: 'L6-t6-B01', label: 'Thống kê', grade: 6 },
  { id: 'L6-t6-B02', label: 'Xác suất', grade: 6 },
  { id: 'L6-t7-B01', label: 'Thể tích khối trụ', grade: 6 },
  // Grade 7
  { id: 'L7-t1-B01', label: 'Số hữu tỉ & Số thực', grade: 7 },
  { id: 'L7-t1-B02', label: 'Phép tính số thực', grade: 7 },
  { id: 'L7-t2-B01', label: 'Cấp số cộng', grade: 7 },
  { id: 'L7-t2-B02', label: 'Cấp số nhân', grade: 7 },
  { id: 'L7-t3-B01', label: 'Đại số: Biểu thức', grade: 7 },
  { id: 'L7-t3-B02', label: 'Phương trình bậc nhất', grade: 7 },
  { id: 'L7-t4-B01', label: 'Tỉ số lượng giác', grade: 7 },
  { id: 'L7-t5-B01', label: 'Hình thang, hình bình hành', grade: 7 },
  { id: 'L7-t5-B02', label: 'Hình thoi, hình chữ nhật', grade: 7 },
  { id: 'L7-t6-B01', label: 'Đường tròn & góc', grade: 7 },
  { id: 'L7-t6-B02', label: 'Thể tích khối tròn xoay', grade: 7 },
  // Grade 8
  { id: 'L8-t1-B01', label: 'Phép nhân chia mẫu số', grade: 8 },
  { id: 'L8-t1-B02', label: 'Phân thức đại số', grade: 8 },
  { id: 'L8-t2-B01', label: 'Bất phương trình bậc nhất', grade: 8 },
  { id: 'L8-t2-B02', label: 'Hệ phương trình bậc nhất', grade: 8 },
  { id: 'L8-t3-B01', label: 'Phương trình bậc hai', grade: 8 },
  { id: 'L8-t3-B02', label: 'Bất phương trình bậc hai', grade: 8 },
  { id: 'L8-t4-B01', label: 'Hình đồng dạng', grade: 8 },
  { id: 'L8-t4-B02', label: 'Định lý Pitago', grade: 8 },
  { id: 'L8-t5-B01', label: 'Hàm số y = ax + b', grade: 8 },
  { id: 'L8-t5-B02', label: 'Hàm số y = ax² + bx + c', grade: 8 },
  { id: 'L8-t6-B01', label: 'Thống kê: Biểu đồ', grade: 8 },
];

export function nodeLabel(nodeId: string): string {
  return KNOWLEDGE_NODES.find((node) => node.id === nodeId)?.label ?? nodeId;
}
