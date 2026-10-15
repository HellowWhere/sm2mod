package com.example.sm2mod;

import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResultHolder;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.Level;
import net.minecraft.world.phys.Vec3;

/** Melta rifle: short-range superheated blast. Limited charges (durability). */
public class MeltaItem extends Item {
    public MeltaItem(Properties props) {
        super(props);
    }

    @Override
    public InteractionResultHolder<ItemStack> use(Level level, Player player, InteractionHand hand) {
        ItemStack gun = player.getItemInHand(hand);
        if (!level.isClientSide) {
            MeltaProjectile blast = new MeltaProjectile(ModEntities.MELTA.get(), player, level);
            blast.setDamage(14.0F);
            blast.shootFromRotation(player, player.getXRot(), player.getYRot(), 0.0F, 2.2F, 0.2F);
            level.addFreshEntity(blast);

            Vec3 look = player.getLookAngle();
            if (level instanceof ServerLevel server) {
                server.sendParticles(ParticleTypes.FLAME, player.getX() + look.x, player.getEyeY() - 0.2D + look.y,
                        player.getZ() + look.z, 15, 0.15D, 0.15D, 0.15D, 0.05D);
            }
            level.playSound(null, player.blockPosition(), SoundEvents.BLAZE_SHOOT, SoundSource.PLAYERS, 1.0F, 0.6F);
            gun.hurtAndBreak(1, player, p -> p.broadcastBreakEvent(hand));
        }
        player.getCooldowns().addCooldown(this, 40);
        return InteractionResultHolder.sidedSuccess(gun, level.isClientSide);
    }
}
