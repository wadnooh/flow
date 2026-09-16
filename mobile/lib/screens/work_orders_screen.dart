import 'package:flutter/material.dart';
import 'package:field_staff_tracker/services/api_service.dart';

class WorkOrdersScreen extends StatefulWidget {
  const WorkOrdersScreen({super.key});

  @override
  State<WorkOrdersScreen> createState() => _WorkOrdersScreenState();
}

class _WorkOrdersScreenState extends State<WorkOrdersScreen> {
  List<dynamic> _workOrders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadWorkOrders();
  }

  Future<void> _loadWorkOrders() async {
    setState(() => _isLoading = true);
    try {
      final orders = await ApiService.getWorkOrders();
      setState(() {
        _workOrders = orders;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('خطأ في جلب أوامر العمل: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _updateStatus(int id, String newStatus) async {
    try {
      await ApiService.updateWorkOrderStatus(id, newStatus);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Colors.green,
          content: Text('تم تحديث حالة أمر العمل بنجاح'),
        ),
      );
      _loadWorkOrders();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(backgroundColor: Colors.red, content: Text('$e')),
      );
    }
  }

  Color _getPriorityColor(String? priority) {
    switch (priority) {
      case 'urgent':
        return Colors.redAccent;
      case 'high':
        return Colors.orangeAccent;
      default:
        return Colors.blueAccent;
    }
  }

  String _getPriorityLabel(String? priority) {
    switch (priority) {
      case 'urgent':
        return 'عاجل جداً';
      case 'high':
        return 'مرتفع';
      default:
        return 'عادي';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        title: const Text(
          'أوامر العمل والتكليفات الميدانية',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadWorkOrders,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF0284C7)))
          : _workOrders.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.assignment_turned_in, size: 64, color: Colors.blueGrey),
                      SizedBox(height: 16),
                      Text(
                        'لا توجد أوامر عمل مسندة حالياً',
                        style: TextStyle(color: Colors.white70, fontSize: 16),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadWorkOrders,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _workOrders.length,
                    itemBuilder: (context, index) {
                      final order = _workOrders[index];
                      final isCompleted = order['status'] == 'completed';
                      final isInProgress = order['status'] == 'in_progress';

                      return Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: _getPriorityColor(order['priority']).withOpacity(0.3),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.between,
                              children: [
                                Expanded(
                                  child: Text(
                                    order['title'] ?? 'بدون عنوان',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: _getPriorityColor(order['priority']).withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    _getPriorityLabel(order['priority']),
                                    style: TextStyle(
                                      color: _getPriorityColor(order['priority']),
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              order['description'] ?? '',
                              style: const TextStyle(color: Colors.white70, fontSize: 13),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                const Icon(Icons.location_on, size: 16, color: Colors.blueGrey),
                                const SizedBox(width: 4),
                                Text(
                                  order['site_name'] ?? 'موقع غير محدد',
                                  style: const TextStyle(color: Colors.blueGrey, fontSize: 12),
                                ),
                                const Spacer(),
                                const Icon(Icons.group, size: 16, color: Colors.blueGrey),
                                const SizedBox(width: 4),
                                Text(
                                  order['assigned_team_name'] ?? 'فريق غير محدد',
                                  style: const TextStyle(color: Colors.blueGrey, fontSize: 12),
                                ),
                              ],
                            ),
                            const Divider(color: Colors.white12, height: 24),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: isCompleted
                                        ? Colors.green.withOpacity(0.2)
                                        : isInProgress
                                            ? Colors.amber.withOpacity(0.2)
                                            : Colors.blue.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    isCompleted
                                        ? 'مكتمل'
                                        : isInProgress
                                            ? 'قيد التنفيذ'
                                            : 'قيد الانتظار',
                                    style: TextStyle(
                                      color: isCompleted
                                          ? Colors.greenAccent
                                          : isInProgress
                                              ? Colors.amberAccent
                                              : Colors.lightBlueAccent,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                                Row(
                                  children: [
                                    if (!isInProgress && !isCompleted)
                                      ElevatedButton(
                                        onPressed: () => _updateStatus(order['id'], 'in_progress'),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: Colors.amber[700],
                                          padding: const EdgeInsets.symmetric(horizontal: 12),
                                        ),
                                        child: const Text('بدء العمل', style: TextStyle(fontSize: 12)),
                                      ),
                                    if (!isCompleted) ...[
                                      const SizedBox(width: 8),
                                      ElevatedButton(
                                        onPressed: () => _updateStatus(order['id'], 'completed'),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: Colors.green[700],
                                          padding: const EdgeInsets.symmetric(horizontal: 12),
                                        ),
                                        child: const Text('إكمال المهمة', style: TextStyle(fontSize: 12)),
                                      ),
                                    ],
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
