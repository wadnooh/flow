import 'package:flutter/material.dart';
import 'package:field_staff_tracker/services/api_service.dart';

class ElectricalScreen extends StatefulWidget {
  const ElectricalScreen({super.key});

  @override
  State<ElectricalScreen> createState() => _ElectricalScreenState();
}

class _ElectricalScreenState extends State<ElectricalScreen> {
  final _formKey = GlobalKey<FormState>();
  final _vl1Controller = TextEditingController(text: '380');
  final _vl2Controller = TextEditingController(text: '381');
  final _vl3Controller = TextEditingController(text: '379');
  final _i1Controller = TextEditingController(text: '45.2');
  final _i2Controller = TextEditingController(text: '44.8');
  final _i3Controller = TextEditingController(text: '46.1');
  final _freqController = TextEditingController(text: '60.0');
  final _fuelController = TextEditingController(text: '85');
  final _notesController = TextEditingController();

  String _sourceType = 'محطة التغذية العامة (SEC)';
  String _generatorStatus = 'يعمل كاحتياطي (Standby)';
  bool _isSubmitting = false;

  @override
  void dispose() {
    _vl1Controller.dispose();
    _vl2Controller.dispose();
    _vl3Controller.dispose();
    _i1Controller.dispose();
    _i2Controller.dispose();
    _i3Controller.dispose();
    _freqController.dispose();
    _fuelController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submitReading() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);

    try {
      final status = await ApiService.getTodayStatus();
      final siteId = status['site']?['id'] ?? 1;

      final data = {
        'site_id': siteId,
        'source_type': _sourceType,
        'voltage_l1': double.tryParse(_vl1Controller.text) ?? 380.0,
        'voltage_l2': double.tryParse(_vl2Controller.text) ?? 380.0,
        'voltage_l3': double.tryParse(_vl3Controller.text) ?? 380.0,
        'current_l1': double.tryParse(_i1Controller.text) ?? 0.0,
        'current_l2': double.tryParse(_i2Controller.text) ?? 0.0,
        'current_l3': double.tryParse(_i3Controller.text) ?? 0.0,
        'frequency_hz': double.tryParse(_freqController.text) ?? 60.0,
        'generator_status': _generatorStatus,
        'fuel_level_percent': double.tryParse(_fuelController.text) ?? 80.0,
        'notes': _notesController.text,
      };

      await ApiService.submitReading(data);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Colors.green,
          content: Text('تم تسجيل القراءات الكهربائية وحفظها بالنظام بنجاح'),
        ),
      );

      _notesController.clear();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(backgroundColor: Colors.red, content: Text('فشل التسجيل: $e')),
      );
    } finally {
      setState(() => _isSubmitting = false);
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
          'تسجيل قراءات الجهد والمولدات',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white10),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'مصدر التغذية الكهربائية',
                      style: TextStyle(color: Colors.white70, fontSize: 13),
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _sourceType,
                      dropdownColor: const Color(0xFF1E293B),
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: const Color(0xFF0F172A),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'محطة التغذية العامة (SEC)', child: Text('محطة التغذية العامة (SEC)')),
                        DropdownMenuItem(value: 'مولد ديزل موقعي (Generator)', child: Text('مولد ديزل موقعي (Generator)')),
                        DropdownMenuItem(value: 'نظام طوارئ UPS', child: Text('نظام طوارئ UPS')),
                      ],
                      onChanged: (v) => setState(() => _sourceType = v!),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'قراءات الجهد الثلاثي الفاز (3-Phase Voltages)',
                      style: TextStyle(color: Colors.amberAccent, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _vl1Controller,
                            keyboardType: TextInputType.number,
                            style: const TextStyle(color: Colors.white),
                            decoration: InputDecoration(
                              labelText: 'L1 (Volt)',
                              labelStyle: const TextStyle(color: Colors.blueGrey),
                              filled: true,
                              fillColor: const Color(0xFF0F172A),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextFormField(
                            controller: _vl2Controller,
                            keyboardType: TextInputType.number,
                            style: const TextStyle(color: Colors.white),
                            decoration: InputDecoration(
                              labelText: 'L2 (Volt)',
                              labelStyle: const TextStyle(color: Colors.blueGrey),
                              filled: true,
                              fillColor: const Color(0xFF0F172A),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextFormField(
                            controller: _vl3Controller,
                            keyboardType: TextInputType.number,
                            style: const TextStyle(color: Colors.white),
                            decoration: InputDecoration(
                              labelText: 'L3 (Volt)',
                              labelStyle: const TextStyle(color: Colors.blueGrey),
                              filled: true,
                              fillColor: const Color(0xFF0F172A),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'التيار الكهربائي المسحوب (Amperes)',
                      style: TextStyle(color: Colors.lightBlueAccent, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _i1Controller,
                            keyboardType: TextInputType.number,
                            style: const TextStyle(color: Colors.white),
                            decoration: InputDecoration(
                              labelText: 'I1 (Amp)',
                              labelStyle: const TextStyle(color: Colors.blueGrey),
                              filled: true,
                              fillColor: const Color(0xFF0F172A),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextFormField(
                            controller: _i2Controller,
                            keyboardType: TextInputType.number,
                            style: const TextStyle(color: Colors.white),
                            decoration: InputDecoration(
                              labelText: 'I2 (Amp)',
                              labelStyle: const TextStyle(color: Colors.blueGrey),
                              filled: true,
                              fillColor: const Color(0xFF0F172A),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextFormField(
                            controller: _i3Controller,
                            keyboardType: TextInputType.number,
                            style: const TextStyle(color: Colors.white),
                            decoration: InputDecoration(
                              labelText: 'I3 (Amp)',
                              labelStyle: const TextStyle(color: Colors.blueGrey),
                              filled: true,
                              fillColor: const Color(0xFF0F172A),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('حالة المولد', style: TextStyle(color: Colors.white70, fontSize: 13)),
                              const SizedBox(height: 6),
                              DropdownButtonFormField<String>(
                                value: _generatorStatus,
                                dropdownColor: const Color(0xFF1E293B),
                                style: const TextStyle(color: Colors.white),
                                decoration: InputDecoration(
                                  filled: true,
                                  fillColor: const Color(0xFF0F172A),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                                items: const [
                                  DropdownMenuItem(value: 'يعمل كاحتياطي (Standby)', child: Text('احتياطي (Standby)')),
                                  DropdownMenuItem(value: 'يعمل تحت الحمل (Running)', child: Text('يعمل تحت الحمل')),
                                  DropdownMenuItem(value: 'متوقف للصيانة (Maintenance)', child: Text('صيانة')),
                                ],
                                onChanged: (v) => setState(() => _generatorStatus = v!),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('مستوى الوقود (%)', style: TextStyle(color: Colors.white70, fontSize: 13)),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _fuelController,
                                keyboardType: TextInputType.number,
                                style: const TextStyle(color: Colors.white),
                                decoration: InputDecoration(
                                  suffixText: '%',
                                  filled: true,
                                  fillColor: const Color(0xFF0F172A),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Text('ملاحظات الفني الميدانية', style: TextStyle(color: Colors.white70, fontSize: 13)),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _notesController,
                      maxLines: 2,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'أي ملاحظات بخصوص حرارة الكابلات، لوحة التوزيع...',
                        hintStyle: const TextStyle(color: Colors.white30, fontSize: 12),
                        filled: true,
                        fillColor: const Color(0xFF0F172A),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton.icon(
                        onPressed: _isSubmitting ? null : _submitReading,
                        icon: const Icon(Icons.send),
                        label: _isSubmitting
                            ? const CircularProgressIndicator(color: Colors.white)
                            : const Text(
                                'حفظ وإرسال القراءة للنظام المركزي',
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                              ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0284C7),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
